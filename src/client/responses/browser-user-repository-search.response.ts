export interface BrowserUserRepositorySearchResponseRootObject {
    users: BrowserUserRepositorySearchResponseUsersItem[];
    places: BrowserUserRepositorySearchResponsePlacesItem[];
    hashtags: BrowserUserRepositorySearchResponseHashtagsItem[];
    has_more: boolean;
    rank_token: string;
    clear_client_cache: null;
    status: string;
}
export interface BrowserUserRepositorySearchResponseUsersItem {
    position: number;
    user: BrowserUserRepositorySearchResponseUser;
}
export interface BrowserUserRepositorySearchResponseUser {
    pk: string;
    username: string;
    full_name: string;
    is_private: boolean;
    profile_pic_url: string;
    profile_pic_id?: string;
    is_verified: boolean;
    has_anonymous_profile_picture: boolean;
    has_highlight_reels: boolean;
    has_opt_eligible_shop: boolean;
    account_badges: any[];
    unseen_count?: number;
    friendship_status: BrowserUserRepositorySearchResponseFriendship_status;
    latest_reel_media: number;
    live_broadcast_id: null;
    should_show_category: boolean;
    seen: number;
}
export interface BrowserUserRepositorySearchResponseFriendship_status {
    following: boolean;
    is_private: boolean;
    incoming_request: boolean;
    outgoing_request: boolean;
    is_bestie: boolean;
    is_restricted: boolean;
    is_feed_favorite: boolean;
}
export interface BrowserUserRepositorySearchResponsePlacesItem {
    place: BrowserUserRepositorySearchResponsePlace;
    position: number;
}
export interface BrowserUserRepositorySearchResponsePlace {
    location: BrowserUserRepositorySearchResponseLocation;
    title: string;
    subtitle: string;
    media_bundles: any[];
    slug: string;
}
export interface BrowserUserRepositorySearchResponseLocation {
    pk: string;
    short_name: string;
    facebook_places_id: number;
    external_source: string;
    name: string;
    address: string;
    city: string;
    has_viewer_saved: boolean;
    lng: number | string;
    lat: number;
}
export interface BrowserUserRepositorySearchResponseHashtagsItem {
    position: number;
    hashtag: BrowserUserRepositorySearchResponseHashtag;
}
export interface BrowserUserRepositorySearchResponseHashtag {
    name: string;
    id: string;
    media_count: number;
    use_default_avatar: boolean;
    profile_pic_url: string;
    search_result_subtitle: string;
}
