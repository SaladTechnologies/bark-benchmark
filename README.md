# bark-benchmark

This project benchmarks the performance of the Bark model, using a preconfigured [Bark image](https://hub.docker.com/r/saladtechnologies/bark).

## Getting Started

To get started with this project, you will need to have Docker installed on your system. Once you have Docker installed, you can run the following command to start the sdnext container:

```bash
docker run --gpus all \
-e BENCHMARK_SIZE=-1 \
-e REPORTING_URL=https://someurl.com \
-e REPORTING_API_KEY=1234567890 \
-e BENCHMARK_ID=bark-benchmark-0 \
saladtechnologies/bark-benchmark:latest
```

or

```bash
docker compose up
```

The `BENCHMARK_SIZE` environment variables can be adjusted to change the size of the benchmark (total images to generate). It can be set to `-1` in order to run the benchmark indefinitely. It should be noted that this is a per-node limit. This value is unaware of other benchmark workers that may be running.

## Build the image

To build the image, run the following command:

```bash
docker buildx build \
-t saladtechnologies/bark-benchmark:latest \
--provenance=false \
--output type=docker \
.
```