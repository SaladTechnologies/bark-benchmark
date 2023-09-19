/**
 * These were automatically generated by taking
 * sample payloads from the api docs and using
 * an automatic type generator.
 */
export interface Text2ImageRequest {
  enable_hr?: boolean;
  denoising_strength?: number;
  firstphase_width?: number;
  firstphase_height?: number;
  hr_scale?: number;
  hr_upscaler?: string;
  hr_second_pass_steps?: number;
  hr_resize_x?: number;
  hr_resize_y?: number;
  refiner_start?: number;
  refiner_prompt?: string;
  refiner_negative?: string;
  prompt: string;
  styles?: string[];
  seed?: number;
  subseed?: number;
  subseed_strength?: number;
  seed_resize_from_h?: number;
  seed_resize_from_w?: number;
  sampler_name?: string;
  latent_sampler?: string;
  batch_size?: number;
  n_iter?: number;
  steps: number;
  cfg_scale: number;
  image_cfg_scale?: number;
  clip_skip?: number;
  width: number;
  height: number;
  restore_faces?: boolean;
  tiling?: boolean;
  do_not_save_samples?: boolean;
  do_not_save_grid?: boolean;
  negative_prompt?: string;
  eta?: number;
  diffusers_guidance_rescale?: number;
  s_min_uncond?: number;
  s_churn?: number;
  s_tmax?: number;
  s_tmin?: number;
  s_noise?: number;
  override_settings?: OverrideSettings;
  override_settings_restore_afterwards?: boolean;
  script_args?: string[];
  sampler_index?: string;
  script_name?: string;
  send_images: boolean;
  save_images?: boolean;
  alwayson_scripts?: AlwaysonScripts;
}

export interface OverrideSettings {}

export interface AlwaysonScripts {}

export interface Text2ImageResponse {
  images: string[];
  parameters: Text2ImageRequest;
  info: string;
}

export interface ServerStatus {
  version: Version
  uptime: string
  timestamp: string
  state: State
  memory: Memory
  platform: Platform
  torch: string
  gpu: Gpu2
  optimizations: string[]
  crossatention: string
  device: Device
  backend: string
  pipeline: string
}

export interface Version {
  app: string
  updated: string
  hash: string
  url: string
}

export interface State {
  started: string
  step: string
  jobs: string
  flags: string
  job: string
  "text-info": string | null
}

export interface Memory {
  ram: Ram
  gpu: Gpu
  "gpu-active": GpuActive
  "gpu-allocated": GpuAllocated
  "gpu-reserved": GpuReserved
  "gpu-inactive": GpuInactive
  events: Events
  utilization: number
}

export interface Ram {
  free: number
  used: number
  total: number
}

export interface Gpu {
  free: number
  used: number
  total: number
}

export interface GpuActive {
  current: number
  peak: number
}

export interface GpuAllocated {
  current: number
  peak: number
}

export interface GpuReserved {
  current: number
  peak: number
}

export interface GpuInactive {
  current: number
  peak: number
}

export interface Events {
  retries: number
  oom: number
}

export interface Platform {
  arch: string
  cpu: string
  system: string
  release: string
  python: string
}

export interface Gpu2 {
  device: string
  cuda: string
  cudnn: number
  driver: string
}

export interface Device {
  active: string
  dtype: string
  vae: string
  unet: string
}

/**
 * These are types for interacting with our
 * queue service.
 */
export type QueueMessage = {
  /**
   * This is the receipt handle for the message,
   * and it will need to be URI encoded in order to be used by the api.
   * 
   * It is used to delete the message.
   * 
   * It is not the id of the job.
   */
  messageId: string;

  /**
   * This message body will JSON.parse
   * into an SDJob.
   */
  body: string;
};

export type GetJobFromQueueResponse = {
  status: string;
  messages: QueueMessage[];
};

export type SDJob = {
  prompt: string;
  id: string;
  batch_size: number;
  upload_url: string[];
};

export type DeleteQueueMessageResponse = {
  message: "Message deleted";
};