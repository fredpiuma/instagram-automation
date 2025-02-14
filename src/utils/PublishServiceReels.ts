import {
  IgApiClient,
  IgConfigureVideoError,
  IgResponse,
  IgResponseError,
  UploadRepositoryVideoResponseRootObject,
  UploadRetryContext,
  UploadVideoOptions
} from 'instagram-private-api'
import Utilidades from './util'

import Chance from 'chance'
import Bluebird from 'bluebird'

import { defaults, defaultsDeep } from 'lodash'
import { PublishService } from 'instagram-private-api/dist/services/publish.service'
import Instagram from './util.instagram'
import { execOnce } from 'next/dist/shared/lib/utils'

export interface MediaConfigureReelVideoOptions {
  upload_id: string
  length: number
  audio_muted?: boolean
  poster_frame_index?: number

  width: number
  height: number

  geotag_enabled?: '1' | '0'
  posting_latitude?: string
  posting_longitude?: string
  media_latitude?: string
  media_longitude?: string

  // story_media_creation_date?: string;
  client_shared_at?: string
  // audience?: "besties";
  // 1 = story-reel, 2 = direct-story (does not support stickers)
  // configure_mode: "1" | string;
  camera_position?: string | 'back'
  allow_multi_configures?: '0' | '1'

  // direct-story share options
  thread_ids?: string[] | string
  // recipient_users?: string[] | string;
  client_context?: string
  // view_mode?: "replayable" | "once" | string;
  // reply_type?: "story" | string;

  caption?: string
  mas_opt_in?: 'NOT_PROMPTED'

  // story_locations?: string;

  // clips: {
  //   length: number;
  //   source_type: string;
  //   camera_position: string;
  // };
}

export interface MediaConfigureReelBaseOptions {
  story_media_creation_date?: string
  client_shared_at?: string
  // audience?: "besties";
  // 1 = story-reel, 2 = direct-story (does not support stickers)
  configure_mode: '1'
  camera_position?: string | 'back'
  allow_multi_configures?: '0' | '1'

  // direct-story share options
  thread_ids?: string[] | string
  recipient_users?: string[] | string
  client_context?: string
  // view_mode?: "replayable" | "once" | string;
  // reply_type?: "story" | string;

  caption?: string
  // mas_opt_in?: "NOT_PROMPTED";

  geotag_enabled?: '1' | '0'
  posting_latitude?: string
  posting_longitude?: string
  media_latitude?: string
  media_longitude?: string
  // caption has to be set

  // internal_features has to be set
  // internal_features?: "polling_sticker";
}

export interface PostingReelVideoOptions extends MediaConfigureReelBaseOptions {
  video: Buffer
  coverImage: Buffer
  transcodeDelay?: number
  location?
  caption?: string
  toBesties?: boolean
  threadIds?: string[]
  recipientUsers?: string[]
  viewMode?: string
  replyType?: string
  hashtags: any[]
  mentions?
}

export interface UploadReelVideoOptions {
  video: Buffer
  uploadId?: string
  duration: number
  width?: number
  height?: number
  // isSidecar?: boolean;
  forAlbum?: boolean
  // isDirect?: boolean;
  // isDirectVoice?: boolean;

  forDirectStory?: boolean
  // isIgtvVideo?: boolean;
  waterfallId?: string
  uploadName?: string
  // offset?: number;
}

export class PublishServiceReels {
  private source_type = '4'
  private configure_mode = '1'
  private client: IgApiClient
  private chance = new Chance()

  public constructor(client: IgApiClient) {
    this.client = client
  }

  /*
  public static getVideoInfo(buffer: Buffer): {
    duration: number;
    width: number;
    height: number;
  } {
    const width = PublishServiceReels.read16(
      buffer,
      ["moov", "trak", "stbl", "avc1"],
      24
    );
    const height = PublishServiceReels.read16(
      buffer,
      ["moov", "trak", "stbl", "avc1"],
      26
    );
    return {
      duration: PublishServiceReels.getMP4Duration(buffer),
      width,
      height,
    };
  }

  private static read16(buffer: Buffer, keys: string[], offset: number) {
    let start = 0;
    for (const key of keys) {
      start = buffer.indexOf(Buffer.from(key), start) + key.length;
    }
    return buffer.readUInt16BE(start + offset);
  }

  public static getMP4Duration(buffer: Buffer): number {
    const timescale = PublishServiceReels.read32(buffer, ["moov", "mvhd"], 12);
    const length = PublishServiceReels.read32(buffer, ["moov", "mvhd"], 12 + 4);
    return Math.floor((length / timescale) * 1000);
  }

  private static read32(buffer: Buffer, keys: string[], offset: number) {
    let start = 0;
    for (const key of keys) {
      start = buffer.indexOf(Buffer.from(key), start) + key.length;
    }
    return buffer.readUInt32BE(start + offset);
  }

  /**/

  private createVideoRuploadParams(
    options: UploadVideoOptions,
    uploadId: number | string,
    retryContext?: UploadRetryContext
  ) {
    const { duration, width, height } = options
    const ruploadParams: any = {
      retry_context: JSON.stringify(
        retryContext || {
          num_step_auto_retry: 0,
          num_reupload: 0,
          num_step_manual_retry: 0
        }
      ),
      media_type: '2',
      product_type: 'clips',
      xsharing_user_ids: JSON.stringify([]),
      upload_id: uploadId.toString(),
      upload_media_height: height?.toString(),
      upload_media_width: width?.toString(),
      upload_media_duration_ms: duration.toString()
    }
    return ruploadParams
  }

  // private async regularVideo2(options: UploadReelVideoOptions) {
  //   options = defaults(options, {
  //     uploadId: Date.now(),
  //     waterfallId: options.waterfallId,
  //   });

  //   options.uploadName =
  //     options.uploadName ||
  //     `${options.uploadId}_0_${Utilidades.getRandomNumber(
  //       1000000000,
  //       9999999999
  //     )}`;
  //   const ruploadParams = this.createVideoRuploadParams(
  //     options,
  //     options.uploadId
  //   );
  //   const { offset } = await this.client.upload.initVideo({
  //     name: options.uploadName,
  //     ruploadParams,
  //     waterfallId: options.waterfallId,
  //   });
  //   return await this.client.upload.video({ offset, ...options });
  // }

  private async configureToReelVideo(options: MediaConfigureReelVideoOptions) {
    const now = Date.now()
    const devicePayload = this.client.state.devicePayload

    // const form = defaultsDeep(options, {
    const form = defaultsDeep(
      {},
      {
        // _csrftoken: this.client.state.cookieCsrfToken,
        // _uid: this.client.state.cookieUserId,
        // _uuid: this.client.state.uuid,

        // client_shared_at: now.toString(),
        // date_time_original: new Date().toISOString().replace(/[-:]/g, ""),
        // supported_capabilities_new: JSON.stringify(
        //   this.client.state.supportedCapabilities
        // ),
        // device_id: this.client.state.deviceId,
        // timezone_offset: "0",
        // device: devicePayload,

        // configure_mode: this.configure_mode,
        // source_type: this.source_type,

        upload_id: options.upload_id,
        caption: '',
        usertags: '',
        custom_accessibility_caption: '',
        retry_timeout: 12,
        clips_uses_original_audio: 1,
        uses_original_audio: 1,
        original_audio: 1,
        audio: 1,
        clips_audio: 1,
        clips_with_audio: 1,
        with_audio: 1,
        enable_audio: 1,
        clips_enable_audio: 1,
        clips_audio_enable: 1,
        audio_enable: 1,
        audio_type: 'original_sounds'
      }
    )

    const { body } = await this.client.request.send({
      url: '/api/v1/media/configure_to_clips/',
      method: 'POST',
      qs: {
        video: '1'
      },
      form: this.client.request.sign(form)
    })

    return body
  }

  private async regularVideo(options: UploadReelVideoOptions) {
    options = defaults(options, {
      uploadId: Date.now(),
      waterfallId: options.waterfallId
    })
    options.uploadName =
      options.uploadName || `${options.uploadId}_0_${Utilidades.getRandomNumber(1000000000, 9999999999)}`
    const ruploadParams = this.createVideoRuploadParams(options, options.uploadId)
    const { offset } = await this.client.upload.initVideo({
      name: options.uploadName,
      ruploadParams,
      waterfallId: options.waterfallId
    })
    return await this.client.upload.video({ offset, ...options })
  }

  private async uploadAndConfigureReelVideo(
    options: PostingReelVideoOptions,
    configureOptions: MediaConfigureReelBaseOptions
  ) {
    const uploadId = new Date().getTime().toString()
    const videoInfo = PublishService.getVideoInfo(options.video)
    const waterfallId = this.chance.guid({ version: 4 })
    options.client_context = this.chance.guid()

    let lastInstagramRequestResponse = await Bluebird.try(() =>
      this.regularVideo({
        video: options.video,
        uploadId,
        forDirectStory: false,
        waterfallId,
        forAlbum: false,
        ...videoInfo,
        duration: videoInfo.duration * 1000.0
      })
    ).catch(IgResponseError, (error) => {
      console.log(error, 'erro no this.regularVideo()')
      throw new IgConfigureVideoError(error.response as IgResponse<UploadRepositoryVideoResponseRootObject>, videoInfo)
    })

    console.log(lastInstagramRequestResponse)

    // lastInstagramRequestResponse = await this.client.upload.photo({
    //   file: options.coverImage,
    //   waterfallId,
    //   uploadId,
    // });

    // console.log(lastInstagramRequestResponse);

    const devicePayload = this.client.state.devicePayload

    // await Bluebird.try(() =>
    //   this.client.media.uploadFinish({
    //     upload_id: uploadId,
    //     source_type: this.source_type,
    //     video: {
    //       length: videoInfo.duration / 1000.0,
    //       audio_muted: false,
    //       poster_frame_index: 2,
    //       clips: [{ length: videoInfo.duration / 1000.0, source_type: "4" }],
    //     },
    //     // clips_share_preview_to_feed: true,
    //     // device: this.client.state.devicePayload,
    //     // length: videoInfo.duration / 1000.0,
    //     // extra: {
    //     //   source_width: videoInfo.width,
    //     //   source_height: videoInfo.height,
    //     // },
    //   })
    // ).catch(
    //   IgResponseError,
    //   PublishService.catchTranscodeError(videoInfo, 5000)
    // );

    /*
    configureOptions = {
      source_type: this.source_type,
      configure_mode: this.configure_mode,
      upload_id: uploadId,
      client_timestamp: new Date().getTime(),
      poster_frame_index: 0,
      length: videoInfo.duration,
      audio_muted: false,
      filter_type: "0",
      // video_result: "deprecated",
      clips: {
        length: videoInfo.duration,
        source_type: this.source_type,
        camera_position: "back",
      },
      device: {
        manufacturer: devicePayload.manufacturer,
        model: devicePayload.model,
        android_version: devicePayload.android_version,
        android_release: devicePayload.android_release,
      },
      extra: {
        source_width: videoInfo.width,
        source_height: videoInfo.height,
      },
    };
    */

    lastInstagramRequestResponse = await Bluebird.try(() =>
      this.configureToReelVideo({
        upload_id: uploadId,
        length: videoInfo.duration / 1000.0,
        width: videoInfo.width,
        height: videoInfo.height,
        ...configureOptions
      })
    ).catch(IgResponseError, (error) => {
      throw new IgConfigureVideoError(error.response as IgResponse<UploadRepositoryVideoResponseRootObject>, videoInfo)
    })

    console.log(lastInstagramRequestResponse)

    return lastInstagramRequestResponse
  }

  public async reel(options: PostingReelVideoOptions) {
    /* daqui */
    const configureOptions: MediaConfigureReelBaseOptions = {
      configure_mode: '1'
    }

    const uploadAndConfigure = () => this.uploadAndConfigureReelVideo(options, configureOptions)

    if (typeof options.hashtags !== 'undefined' && options.hashtags.length > 0) {
      if (typeof options.caption === 'undefined') {
        options.caption = ''
      }
      options.hashtags.forEach((hashtag) => {
        if (hashtag.tag_name.includes('#')) {
          hashtag.tag_name = hashtag.tag_name.replace('#', '')
        }
        if (!options.caption.includes(hashtag.tag_name)) {
          options.caption = `${options.caption} ${hashtag.tag_name}`
        }
      })
    }

    // if (typeof options.location !== "undefined") {
    //   const { latitude, longitude } = options.location;
    //   configureOptions.geotag_enabled = "1";
    //   configureOptions.posting_latitude = latitude;
    //   configureOptions.posting_longitude = longitude;
    //   configureOptions.media_latitude = latitude;
    //   configureOptions.media_longitude = longitude;
    // }
    // if (
    //   typeof options.mentions !== "undefined" &&
    //   options.mentions.length > 0
    // ) {
    //   if (typeof options.caption === "undefined") {
    //     options.caption = "";
    //   } else {
    //     options.caption = options.caption.replace(" ", "+") + "+";
    //   }
    // }

    return uploadAndConfigure()
    /* ate aqui */

    /*
    const uploadAndConfigure = () => this.uploadAndConfigureReelVideo(options);

    if (
      typeof options.hashtags !== "undefined" &&
      options.hashtags.length > 0
    ) {
      if (typeof options.caption === "undefined") {
        options.caption = "";
      }
      options.hashtags.forEach((hashtag) => {
        if (hashtag.tag_name.includes("#")) {
          hashtag.tag_name = hashtag.tag_name.replace("#", "");
        }
        if (!options.caption.includes(hashtag.tag_name)) {
          options.caption = `${options.caption} ${hashtag.tag_name}`;
        }
      });
    }

    return await uploadAndConfigure();
    /** */
  }
}
