

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
   * into a BarkJob.
   */
  body: string;
};

export type GetJobFromQueueResponse = {
  status: string;
  messages: QueueMessage[];
};

export type BarkRequest = {
  text: string;
  voice_preset?: string;
};

export type BarkJob = {
  id: number;
  voice: string;
  script_section: string;
  section_index: number;
  upload_url: string;
};

export type DeleteQueueMessageResponse = {
  message: "Message deleted";
};