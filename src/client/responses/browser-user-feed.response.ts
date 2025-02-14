export interface BrowserUserFeedResponseRootObject {
    statusCode: number;
    body: BrowserUserFeedResponseBody;
    headers: BrowserUserFeedResponseHeaders;
    request: BrowserUserFeedResponseRequest;
}
export interface BrowserUserFeedResponseBody {
    data: BrowserUserFeedResponseData;
    status: string;
}
export interface BrowserUserFeedResponseData {
    user: BrowserUserFeedResponseUser;
}
export interface BrowserUserFeedResponseUser {
    edge_owner_to_timeline_media?: BrowserUserFeedResponseEdge_owner_to_timeline_media;
    full_name?: string;
    followed_by_viewer?: boolean;
    id?: string;
    is_verified?: boolean;
    profile_pic_url?: string;
    username?: string;
}
export interface BrowserUserFeedResponseEdge_owner_to_timeline_media {
    count: number;
    page_info: BrowserUserFeedResponsePage_info;
    edges: BrowserUserFeedResponseEdgesItem[];
}
export interface BrowserUserFeedResponsePage_info {
    has_next_page: boolean;
    end_cursor: string;
}
export interface BrowserUserFeedResponseEdgesItem {
    node: BrowserUserFeedResponseNode;
}
export interface BrowserUserFeedResponseNode {
    __typename?: string;
    id?: string;
    gating_info?: null;
    fact_check_overall_rating?: null;
    fact_check_information?: null;
    media_overlay_info?: null;
    sensitivity_friction_info?: null;
    sharing_friction_info?: BrowserUserFeedResponseSharing_friction_info;
    dimensions?: BrowserUserFeedResponseDimensions;
    display_url?: string;
    display_resources?: BrowserUserFeedResponseDisplayResourcesItem[];
    is_video?: boolean;
    media_preview?: string | null;
    tracking_token?: string;
    has_upcoming_event?: boolean;
    edge_media_to_tagged_user?: BrowserUserFeedResponseEdge_media_to_tagged_user;
    dash_info?: BrowserUserFeedResponseDash_info;
    has_audio?: boolean;
    video_url?: string;
    video_view_count?: number;
    edge_media_to_caption?: BrowserUserFeedResponseEdge_media_to_caption;
    shortcode?: string;
    edge_media_to_comment?: BrowserUserFeedResponseEdge_media_to_comment;
    edge_media_to_sponsor_user?: BrowserUserFeedResponseEdge_media_to_sponsor_user;
    is_affiliate?: boolean;
    is_paid_partnership?: boolean;
    comments_disabled?: boolean;
    taken_at_timestamp?: number;
    edge_media_preview_like?: BrowserUserFeedResponseEdge_media_preview_like;
    owner?: BrowserUserFeedResponseOwner;
    location?: null;
    nft_asset_info?: null;
    viewer_has_liked?: boolean;
    viewer_has_saved?: boolean;
    viewer_has_saved_to_collection?: boolean;
    viewer_in_photo_of_you?: boolean;
    viewer_can_reshare?: boolean;
    thumbnail_src?: string;
    thumbnail_resources?: BrowserUserFeedResponseThumbnailResourcesItem[];
    coauthor_producers?: BrowserUserFeedResponseCoauthorProducersItem[];
    pinned_for_users?: BrowserUserFeedResponsePinnedForUsersItem[];
    product_type?: string;
    user?: BrowserUserFeedResponseUser;
    x?: number;
    y?: number;
    text?: string;
    profile_pic_url?: string;
    username?: string;
    accessibility_caption?: null;
    edge_sidecar_to_children?: BrowserUserFeedResponseEdge_sidecar_to_children;
}
export interface BrowserUserFeedResponseSharing_friction_info {
    should_have_sharing_friction: boolean;
    bloks_app_url: null;
}
export interface BrowserUserFeedResponseDimensions {
    height: number;
    width: number;
}
export interface BrowserUserFeedResponseDisplayResourcesItem {
    src: string;
    config_width: number;
    config_height: number;
}
export interface BrowserUserFeedResponseEdge_media_to_tagged_user {
    edges: BrowserUserFeedResponseEdgesItem[];
}
export interface BrowserUserFeedResponseDash_info {
    is_dash_eligible: boolean;
    video_dash_manifest: string | null;
    number_of_qualities: number;
}
export interface BrowserUserFeedResponseEdge_media_to_caption {
    edges: BrowserUserFeedResponseEdgesItem[];
}
export interface BrowserUserFeedResponseEdge_media_to_comment {
    count: number;
    page_info: BrowserUserFeedResponsePage_info;
}
export interface BrowserUserFeedResponseEdge_media_to_sponsor_user {
    edges: any[];
}
export interface BrowserUserFeedResponseEdge_media_preview_like {
    count: number;
    edges: BrowserUserFeedResponseEdgesItem[];
}
export interface BrowserUserFeedResponseOwner {
    id: string;
    username: string;
}
export interface BrowserUserFeedResponseThumbnailResourcesItem {
    src: string;
    config_width: number;
    config_height: number;
}
export interface BrowserUserFeedResponseCoauthorProducersItem {
    id: string;
    is_verified: boolean;
    profile_pic_url: string;
    username: string;
}
export interface BrowserUserFeedResponsePinnedForUsersItem {
    id: string;
    is_verified: boolean;
    profile_pic_url: string;
    username: string;
}
export interface BrowserUserFeedResponseEdge_sidecar_to_children {
    edges: BrowserUserFeedResponseEdgesItem[];
}
export interface BrowserUserFeedResponseHeaders {
    'content-type'?: string;
    vary?: string;
    'content-language'?: string;
    'access-control-allow-origin'?: string;
    'access-control-allow-credentials'?: string;
    date?: string;
    'content-encoding'?: string;
    'strict-transport-security'?: string;
    'cache-control'?: string;
    pragma?: string;
    expires?: string;
    'x-frame-options'?: string;
    'content-security-policy'?: string;
    'cross-origin-embedder-policy-report-only'?: string;
    'report-to'?: string;
    'origin-trial'?: string;
    'cross-origin-opener-policy-report-only'?: string;
    'x-content-type-options'?: string;
    'x-xss-protection'?: string;
    'x-ig-push-state'?: string;
    'x-aed'?: string;
    'x-ig-set-www-claim'?: string;
    'access-control-expose-headers'?: string;
    'x-ig-request-elapsed-time-ms'?: string;
    'x-ig-peak-time'?: string;
    'set-cookie'?: string[];
    'x-ig-origin-region'?: string;
    'x-fb-trip-id'?: string;
    'alt-svc'?: string;
    connection?: string;
    'content-length'?: string;
    'Viewport-Width'?: string;
    'X-Requested-With'?: string;
    'Sec-Ch-Prefers-Color-Scheme'?: string;
    Referer?: string;
    accept?: string;
    'accept-language'?: string;
    origin?: string;
    referer?: string;
    'sec-fetch-dest'?: string;
    'sec-fetch-mode'?: string;
    'sec-fetch-site'?: string;
    'user-agent'?: string;
    'sec-ch-ua'?: string;
    'sec-ch-ua-mobile'?: string;
    'sec-ch-ua-platform'?: string;
    'x-asbd-id'?: string;
    'x-csrftoken'?: string;
    'x-ig-app-id'?: string;
    'x-ig-www-claim'?: string;
    'x-instagram-ajax'?: string;
    cookie?: string;
    'accept-encoding'?: string;
}
export interface BrowserUserFeedResponseRequest {
    uri: BrowserUserFeedResponseUri;
    method: string;
    headers: BrowserUserFeedResponseHeaders;
}
export interface BrowserUserFeedResponseUri {
    protocol: string;
    slashes: boolean;
    auth: null;
    host: string;
    port: null;
    hostname: string;
    hash: null;
    search: string;
    query: string;
    pathname: string;
    path: string;
    href: string;
}
