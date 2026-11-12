# Native TV — the honest version

## What works now

- Google TV, Android TV and Fire TV: use the browser, or install the fullscreen PWA.
- Apple TV: AirPlay from an iPhone, iPad or Mac. There is no browser on tvOS.
- A TV browser is not a native app. Older remotes and sticks will feel slower.

## Why a native Apple TV app is a separate project

A tvOS app cannot wrap this website: tvOS has no public WebKit view. A real app
needs native playback (AVPlayer/HLS), its own source handling, remote focus,
signing, App Store review and a support plan. It is not a build step.

## Android TV wrapper

An Android TV WebView wrapper is possible, but it inherits the same YouTube embed
limits. It would not be faster than the browser unless the playback layer is native.

## Next step if you want native

1. Choose a licensed source (your tuner/IPTV provider, not scraped YouTube).
2. Build a tvOS/Android TV player around that source.
3. Keep this site as the free web preview and account/sync surface.
