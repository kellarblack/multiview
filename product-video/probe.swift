import AVFoundation
import Foundation
let asset = AVURLAsset(url: URL(fileURLWithPath: CommandLine.arguments[1]))
print("video tracks:", asset.tracks(withMediaType: .video).count)
print("audio tracks:", asset.tracks(withMediaType: .audio).count)
print("duration:", CMTimeGetSeconds(asset.duration))
