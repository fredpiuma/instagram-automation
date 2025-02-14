export interface BrowserUserRepositoryInfoByUsernameResponseRootObject {
    statusCode: number;
    body: BrowserUserRepositoryInfoByUsernameResponseBody;
    headers: BrowserUserRepositoryInfoByUsernameResponseHeaders;
    request: BrowserUserRepositoryInfoByUsernameResponseRequest;
}
export interface BrowserUserRepositoryInfoByUsernameResponseBody {
    data: BrowserUserRepositoryInfoByUsernameResponseData;
    status: string;
}
export interface BrowserUserRepositoryInfoByUsernameResponseData {
    user: BrowserUserRepositoryInfoByUsernameResponseUser;
}
export interface BrowserUserRepositoryInfoByUsernameResponseUser {
    biography?: string;
    bio_links?: any[];
    biography_with_entities?: BrowserUserRepositoryInfoByUsernameResponseBiography_with_entities;
    blocked_by_viewer?: boolean;
    restricted_by_viewer?: boolean;
    country_block?: boolean;
    external_url?: string;
    external_url_linkshimmed?: string;
    edge_followed_by?: BrowserUserRepositoryInfoByUsernameResponseEdge_followed_by;
    fbid?: string;
    followed_by_viewer: boolean;
    edge_follow?: BrowserUserRepositoryInfoByUsernameResponseEdge_follow;
    follows_viewer?: boolean;
    full_name: string;
    group_metadata?: null;
    has_ar_effects?: boolean;
    has_clips?: boolean;
    has_guides?: boolean;
    has_channel?: boolean;
    has_blocked_viewer?: boolean;
    highlight_reel_count?: number;
    has_requested_viewer?: boolean;
    hide_like_and_view_counts?: boolean;
    id: string;
    is_business_account?: boolean;
    is_eligible_to_view_account_transparency?: boolean;
    is_professional_account?: boolean;
    is_supervision_enabled?: boolean;
    is_guardian_of_viewer?: boolean;
    is_supervised_by_viewer?: boolean;
    is_supervised_user?: boolean;
    is_embeds_disabled?: boolean;
    is_joined_recently?: boolean;
    guardian_id?: null;
    business_address_json?: null;
    business_contact_method?: string;
    business_email?: null;
    business_phone_number?: null;
    business_category_name?: string;
    overall_category_name?: null;
    category_enum?: string;
    category_name?: string;
    is_private?: boolean;
    is_verified: boolean;
    edge_mutual_followed_by?: BrowserUserRepositoryInfoByUsernameResponseEdge_mutual_followed_by;
    profile_pic_url: string;
    profile_pic_url_hd?: string;
    requested_by_viewer?: boolean;
    should_show_category?: boolean;
    should_show_public_contacts?: boolean;
    state_controlled_media_country?: null;
    location_transparency_country?: null;
    transparency_label?: null;
    transparency_product?: string;
    username: string;
    connected_fb_page?: null;
    pronouns?: any[];
    edge_felix_video_timeline?: BrowserUserRepositoryInfoByUsernameResponseEdge_felix_video_timeline;
    edge_owner_to_timeline_media?: BrowserUserRepositoryInfoByUsernameResponseEdge_owner_to_timeline_media;
    edge_saved_media?: BrowserUserRepositoryInfoByUsernameResponseEdge_saved_media;
    edge_media_collections?: BrowserUserRepositoryInfoByUsernameResponseEdge_media_collections;
}
export interface BrowserUserRepositoryInfoByUsernameResponseBiography_with_entities {
    raw_text: string;
    entities: any[];
}
export interface BrowserUserRepositoryInfoByUsernameResponseEdge_followed_by {
    count: number;
}
export interface BrowserUserRepositoryInfoByUsernameResponseEdge_follow {
    count: number;
}
export interface BrowserUserRepositoryInfoByUsernameResponseEdge_mutual_followed_by {
    count: number;
    edges: BrowserUserRepositoryInfoByUsernameResponseEdgesItem[];
}
export interface BrowserUserRepositoryInfoByUsernameResponseEdgesItem {
    node: BrowserUserRepositoryInfoByUsernameResponseNode;
}
export interface BrowserUserRepositoryInfoByUsernameResponseNode {
    username?: string;
    __typename?: string;
    id?: string;
    shortcode?: string;
    dimensions?: BrowserUserRepositoryInfoByUsernameResponseDimensions;
    display_url?: string;
    edge_media_to_tagged_user?: BrowserUserRepositoryInfoByUsernameResponseEdge_media_to_tagged_user;
    fact_check_overall_rating?: null;
    fact_check_information?: null;
    gating_info?: null;
    sharing_friction_info?: BrowserUserRepositoryInfoByUsernameResponseSharing_friction_info;
    media_overlay_info?: null;
    media_preview?: string | null;
    owner?: BrowserUserRepositoryInfoByUsernameResponseOwner;
    is_video?: boolean;
    has_upcoming_event?: boolean;
    accessibility_caption?: null | string;
    dash_info?: BrowserUserRepositoryInfoByUsernameResponseDash_info;
    has_audio?: boolean;
    tracking_token?: string;
    video_url?: string;
    video_view_count?: number;
    edge_media_to_caption?: BrowserUserRepositoryInfoByUsernameResponseEdge_media_to_caption;
    edge_media_to_comment?: BrowserUserRepositoryInfoByUsernameResponseEdge_media_to_comment;
    comments_disabled?: boolean;
    taken_at_timestamp?: number;
    edge_liked_by?: BrowserUserRepositoryInfoByUsernameResponseEdge_liked_by;
    edge_media_preview_like?: BrowserUserRepositoryInfoByUsernameResponseEdge_media_preview_like;
    location?: null;
    nft_asset_info?: null;
    thumbnail_src?: string;
    thumbnail_resources?: BrowserUserRepositoryInfoByUsernameResponseThumbnailResourcesItem[];
    felix_profile_grid_crop?: null;
    coauthor_producers?: BrowserUserRepositoryInfoByUsernameResponseCoauthorProducersItem[];
    pinned_for_users?: any[];
    encoding_status?: null;
    is_published?: boolean;
    product_type?: string;
    title?: string;
    video_duration?: number;
    text?: string;
    clips_music_attribution_info?: null;
    edge_sidecar_to_children?: BrowserUserRepositoryInfoByUsernameResponseEdge_sidecar_to_children;
    user?: BrowserUserRepositoryInfoByUsernameResponseUser;
    x?: number;
    y?: number;
}
export interface BrowserUserRepositoryInfoByUsernameResponseEdge_felix_video_timeline {
    count: number;
    page_info: BrowserUserRepositoryInfoByUsernameResponsePage_info;
    edges: BrowserUserRepositoryInfoByUsernameResponseEdgesItem[];
}
export interface BrowserUserRepositoryInfoByUsernameResponsePage_info {
    has_next_page: boolean;
    end_cursor: string | null;
}
export interface BrowserUserRepositoryInfoByUsernameResponseDimensions {
    height: number;
    width: number;
}
export interface BrowserUserRepositoryInfoByUsernameResponseEdge_media_to_tagged_user {
    edges: BrowserUserRepositoryInfoByUsernameResponseEdgesItem[];
}
export interface BrowserUserRepositoryInfoByUsernameResponseSharing_friction_info {
    should_have_sharing_friction: boolean;
    bloks_app_url: null;
}
export interface BrowserUserRepositoryInfoByUsernameResponseOwner {
    id: string;
    username: string;
}
export interface BrowserUserRepositoryInfoByUsernameResponseDash_info {
    is_dash_eligible: boolean;
    video_dash_manifest: null | string;
    number_of_qualities: number;
}
export interface BrowserUserRepositoryInfoByUsernameResponseEdge_media_to_caption {
    edges: BrowserUserRepositoryInfoByUsernameResponseEdgesItem[];
}
export interface BrowserUserRepositoryInfoByUsernameResponseEdge_media_to_comment {
    count: number;
}
export interface BrowserUserRepositoryInfoByUsernameResponseEdge_liked_by {
    count: number;
}
export interface BrowserUserRepositoryInfoByUsernameResponseEdge_media_preview_like {
    count: number;
}
export interface BrowserUserRepositoryInfoByUsernameResponseThumbnailResourcesItem {
    src: string;
    config_width: number;
    config_height: number;
}
export interface BrowserUserRepositoryInfoByUsernameResponseEdge_owner_to_timeline_media {
    count: number;
    page_info: BrowserUserRepositoryInfoByUsernameResponsePage_info;
    edges: BrowserUserRepositoryInfoByUsernameResponseEdgesItem[];
}
export interface BrowserUserRepositoryInfoByUsernameResponseCoauthorProducersItem {
    id: string;
    is_verified: boolean;
    profile_pic_url: string;
    username: string;
}
export interface BrowserUserRepositoryInfoByUsernameResponseEdge_sidecar_to_children {
    edges: BrowserUserRepositoryInfoByUsernameResponseEdgesItem[];
}
export interface BrowserUserRepositoryInfoByUsernameResponseEdge_saved_media {
    count: number;
    page_info: BrowserUserRepositoryInfoByUsernameResponsePage_info;
    edges: any[];
}
export interface BrowserUserRepositoryInfoByUsernameResponseEdge_media_collections {
    count: number;
    page_info: BrowserUserRepositoryInfoByUsernameResponsePage_info;
    edges: any[];
}
export interface BrowserUserRepositoryInfoByUsernameResponseHeaders {
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
    'cross-origin-resource-policy'?: string;
    'origin-trial'?: string;
    'cross-origin-opener-policy'?: string;
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
export interface BrowserUserRepositoryInfoByUsernameResponseRequest {
    uri: BrowserUserRepositoryInfoByUsernameResponseUri;
    method: string;
    headers: BrowserUserRepositoryInfoByUsernameResponseHeaders;
}
export interface BrowserUserRepositoryInfoByUsernameResponseUri {
    protocol: string;
    slashes: boolean;
    auth: null;
    host: string;
    port: number;
    hostname: string;
    hash: null;
    search: string;
    query: string;
    pathname: string;
    path: string;
    href: string;
}
