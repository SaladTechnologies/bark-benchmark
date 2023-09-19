import { 
  BarkJob,
  BarkRequest,
  GetJobFromQueueResponse, 
  DeleteQueueMessageResponse 
} from "./types";
import { exec } from "node:child_process";
import os from "node:os";

const {
  SERVER_URL = "http://127.0.0.1:8000",
  BENCHMARK_SIZE = "10", 
  REPORTING_URL = "http://localhost:3000",
  REPORTING_AUTH_HEADER = "Benchmark-Api-Key",
  REPORTING_API_KEY = "abc1234567890",
  BENCHMARK_ID = "bark-test",
  QUEUE_URL = "http://localhost:3001",
  QUEUE_NAME = "bark-test",
} = process.env;

const benchmarkSize = parseInt(BENCHMARK_SIZE, 10);

/**
 * This is the job that will be submitted to the server,
 * set to the configured batch size.
 * 
 * You can change this to whatever you want, and there are a lot
 * of options. See the SDNext API docs for more info.
 */
const testJob: BarkRequest = {
  text: "This is a test",
  voice_preset: "v2/en_speaker_6",
};


/**
 * 
 * @returns The GPU type as reported by nvidia-smi
 */
function getGpuType() : Promise<string> {
  return new Promise((resolve, reject) => {
    exec("nvidia-smi --query-gpu=name --format=csv,noheader,nounits", (error, stdout, stderr) => {
      if (error) {
        reject("Error fetching GPU info or nvidia-smi might not be installed");
        return;
      }
      resolve(stdout.trim());
    });
  });
}

/**
 * 
 * @returns The number of vCPUs and the total memory in GB
 */
function getSystemInfo() : { vCPU: number, MemGB: number } {
  const vCPU = os.cpus().length;
  const MemGB = Math.round((os.totalmem() / (1024 ** 3)) * 100) / 100; // Convert bytes to GB and round to 2 decimal places

  return { vCPU, MemGB };
}

/**
 * You can replace this function with your own implementation.
 * Could be submitting stats to a database, or to an api, or just
 * printing to the console.
 * 
 * In this case, we're sending the results to our reporting server.
 */
async function recordResult(result: {
  recipe_id: number, 
  script_section: string,
  section_index: number, 
  inference_time: number, 
  output_url: string,
  voice: string | undefined,
  system_info: {
    vCPU: number,
    MemGB: number,
    gpu: string
  }}): Promise<void> {
  const url = new URL("/" + BENCHMARK_ID, REPORTING_URL);
  await fetch(url.toString(), {
    method: "POST",
    body: JSON.stringify(result),
    headers: {
      "Content-Type": "application/json",
      [REPORTING_AUTH_HEADER]: REPORTING_API_KEY,
    },
  });
}


/**
 * This function gets a job from the queue, and returns it in a format that is usable
 * by the SDNext server, along with additional information needed to finish processing the job.
 * 
 * @returns A job to submit to the server
 */
async function getJob(): Promise<{request: BarkRequest, messageId: string, job: BarkJob } | null> {
  const url = new URL("/" + QUEUE_NAME, QUEUE_URL);
  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      [REPORTING_AUTH_HEADER]: REPORTING_API_KEY,
    },
  });
  const queueMessage = await response.json() as GetJobFromQueueResponse;
  if (queueMessage.messages?.length) {
    const job = JSON.parse(queueMessage.messages[0].body) as BarkJob;

    return {
      request: {
        text: job.script_section,
        voice_preset: job.voice,
      },
      messageId: queueMessage.messages[0].messageId,
      job,
    };

  } else {
    return null;
  }
}

/**
 * Deletes a message from the queue, indicating it does not need to be processed again.
 * @param messageId The id of the message to delete from the queue
 * @returns 
 */
async function markJobComplete(messageId: string): Promise<DeleteQueueMessageResponse> {
  const url = new URL(`/${QUEUE_NAME}/${encodeURIComponent(messageId)}`, QUEUE_URL);
  const response = await fetch(url.toString(), {
    method: "DELETE",
    headers: {
      [REPORTING_AUTH_HEADER]: REPORTING_API_KEY,
    },
  });
  const json = await response.json() as DeleteQueueMessageResponse;

  return json;
}

/**
 * Submits a job to the Bark server and returns the response.
 * @param job The job to submit to the server
 * @returns The response from the server
 */
async function submitJob(job: BarkRequest): Promise<ArrayBuffer> {
  // POST to /generate
  const url = new URL("/generate", SERVER_URL);
  const response = await fetch(url.toString(), {
    method: "POST", 
    body: JSON.stringify(job),
    headers: {
      "Content-Type": "application/json"
    },
  });


  if (!response.ok) {
    throw new Error(`Error submitting job: ${response.status} ${response.statusText}\n${await response.text()}`);
  }

  const mp3 = await response.arrayBuffer();


  return mp3;
}

/**
 * Uploads an audio clip to s3 using the signed url provided by the job
 * @param image The image to upload, base64 encoded
 * @param url The signed url to upload the image to
 * 
 * @returns The download url of the uploaded image
 */
async function uploadAudio(audio: ArrayBuffer, url: string): Promise<string> {
  await fetch(url, {
    method: "PUT",
    body: audio,
    headers: {
      "Content-Type": "audio/mpeg",
    },
  });

  // Return the full url, minus the query string
  return url.split("?")[0];
}

/**
 * Uses the status endpoint to get the status of the SDNext server.
 * @returns The status of the SDNext server
 */
async function getServerStatus(): Promise<string> {
  const url = new URL("/hc", SERVER_URL);
  const response = await fetch(url.toString());
  const text = await response.text();

  return text;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let stayAlive = true;
process.on("SIGINT", () => {
  stayAlive = false;
});

process.on("exit", () => {
  /**
   * This is where to put any cleanup code,
   * or a last chance to fire stats off to wherever they live.
   */
});


/**
 * Waits for the SDNext server to start listening at the configured URL.
 */
async function waitForServerToStart(): Promise<void> {
  const maxAttempts = 300;
  let attempts = 0;
  while (stayAlive && attempts++ < maxAttempts) {
    try {
      await getServerStatus();
      return;
    } catch (e) {
      console.log(`(${attempts}/${maxAttempts}) Waiting for server to start...`);
      await sleep(1000);
    }
  }
}

/**
 * This is a helper function to pretty print an object,
 * useful for debugging.
 * @param obj The object to pretty print
 * @returns 
 */
const prettyPrint = (obj: any): void => console.log(JSON.stringify(obj, null, 2));

/**
 * This is the main function that runs the benchmark.
 */
async function main(): Promise<void> {
  /**
   * We get the GPU type and system info before we start the benchmark.
   * We intentionally do not put this in a try/catch block, because if it fails,
   * it means there isn't a gpu available, and we want to fail fast.
   */
  const gpu = await getGpuType();
  const systemInfo = {...getSystemInfo(), gpu };
  console.log("System Info:", JSON.stringify(systemInfo));

  const loadStart = Date.now();

  /**
   * This is where we wait for the server to start and the model to load.
   * It can take several minutes.
   */
  await waitForServerToStart();

  /**
   * We run a single job to verify that everything is working.
   */
  let response = await submitJob(testJob);

  const loadEnd = Date.now();
  const loadElapsed = loadEnd - loadStart;
  console.log(`Server fully warm in ${loadElapsed}ms`);

  let numClips = 0;
  const start = Date.now();
  while (stayAlive && (benchmarkSize < 0 || numClips < benchmarkSize)) {
    console.log("Fetching Job...");
    const job = await getJob();

    if (!job) {
      console.log("No jobs available. Waiting...");
      await sleep(1000);
      continue;
    }

    const { request, messageId, job: rawJob } = job;

    console.log("Submitting Job...");
    const jobStart = Date.now();
    response = await submitJob(request);
    const jobEnd = Date.now();
    const jobElapsed = jobEnd - jobStart;
    console.log(`Clip generated in ${jobElapsed}ms`);
    
    numClips += 1;

    /**
     * By not awaiting this, we can get started on the next job
     * while the clips are uploading.
     */
    uploadAudio(response, rawJob.upload_url)
      .then(async (downloadUrl) => {
        await recordResult({
          recipe_id: rawJob.id,
          script_section: request.text,
          section_index: rawJob.section_index,
          output_url: downloadUrl,
          voice: request.voice_preset,
          inference_time: jobElapsed,
          system_info: systemInfo
        });
        return downloadUrl;
      }).then((downloadUrl) => {
        markJobComplete(messageId);
        prettyPrint({text: request.text, inference_time: jobElapsed, output_url: downloadUrl});
      });
  }
  const end = Date.now();
  const elapsed = end - start;
  if (benchmarkSize > 0) {
    console.log(`Generated ${numClips} images in ${elapsed}ms`);
    console.log(`Average time per image: ${elapsed / numClips}ms`);
  }
}

// Start the benchmark
main();