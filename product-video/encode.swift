import AVFoundation
import CoreImage
import Foundation
import ImageIO

// Usage: encode <frames-dir> <out.mp4> [fps]
let args = CommandLine.arguments
guard args.count >= 3 else {
    fputs("usage: encode <frames-dir> <out.mp4> [fps]\n", stderr)
    exit(2)
}
let framesDir = URL(fileURLWithPath: args[1])
let outURL = URL(fileURLWithPath: args[2])
let fps = args.count > 3 ? Int32(args[3]) ?? 24 : 24

let fm = FileManager.default
let names = try fm.contentsOfDirectory(atPath: framesDir.path)
    .filter { $0.hasSuffix(".png") }
    .sorted()
guard let firstName = names.first else {
    fputs("no frames\n", stderr)
    exit(2)
}

func imageSize(_ url: URL) -> (Int, Int)? {
    guard let src = CGImageSourceCreateWithURL(url as CFURL, nil),
          let props = CGImageSourceCopyPropertiesAtIndex(src, 0, nil) as? [CFString: Any],
          let w = props[kCGImagePropertyPixelWidth] as? Int,
          let h = props[kCGImagePropertyPixelHeight] as? Int else { return nil }
    return (w, h)
}
guard let (width, height) = imageSize(framesDir.appendingPathComponent(firstName)) else {
    fputs("cannot read first frame\n", stderr)
    exit(2)
}

try? fm.removeItem(at: outURL)
let writer = try AVAssetWriter(outputURL: outURL, fileType: .mp4)
let settings: [String: Any] = [
    AVVideoCodecKey: AVVideoCodecType.h264,
    AVVideoWidthKey: width,
    AVVideoHeightKey: height,
    AVVideoCompressionPropertiesKey: [
        AVVideoAverageBitRateKey: 2_600_000,
        AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
        AVVideoMaxKeyFrameIntervalKey: Int(fps),
        AVVideoAllowFrameReorderingKey: true,
    ],
]
let input = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
input.expectsMediaDataInRealTime = false
let adaptor = AVAssetWriterInputPixelBufferAdaptor(
    assetWriterInput: input,
    sourcePixelBufferAttributes: [
        kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
        kCVPixelBufferWidthKey as String: width,
        kCVPixelBufferHeightKey as String: height,
        kCVPixelBufferCGImageCompatibilityKey as String: true,
        kCVPixelBufferCGBitmapContextCompatibilityKey as String: true,
    ]
)
guard writer.canAdd(input) else {
    fputs("cannot add writer input\n", stderr)
    exit(2)
}
writer.add(input)
guard writer.startWriting() else {
    fputs("startWriting failed: \(writer.error?.localizedDescription ?? "unknown")\n", stderr)
    exit(2)
}
writer.startSession(atSourceTime: .zero)

let ciContext = CIContext(options: [.workingColorSpace: NSNull()])
var appended = 0
for (i, name) in names.enumerated() {
    let url = framesDir.appendingPathComponent(name)
    guard let src = CGImageSourceCreateWithURL(url as CFURL, nil),
          let image = CGImageSourceCreateImageAtIndex(src, 0, nil) else {
        fputs("cannot read \(name)\n", stderr)
        exit(2)
    }
    while !input.isReadyForMoreMediaData {
        usleep(2000)
    }
    guard let pool = adaptor.pixelBufferPool else {
        fputs("no pixel buffer pool\n", stderr)
        exit(2)
    }
    var pb: CVPixelBuffer?
    guard CVPixelBufferPoolCreatePixelBuffer(nil, pool, &pb) == kCVReturnSuccess, let buffer = pb else {
        fputs("cannot allocate pixel buffer\n", stderr)
        exit(2)
    }
    CVPixelBufferLockBaseAddress(buffer, [])
    ciContext.render(CIImage(cgImage: image), to: buffer)
    CVPixelBufferUnlockBaseAddress(buffer, [])
    let pts = CMTime(value: Int64(i), timescale: fps)
    if !adaptor.append(buffer, withPresentationTime: pts) {
        fputs("append failed at \(i): \(writer.error?.localizedDescription ?? "unknown")\n", stderr)
        exit(2)
    }
    appended += 1
    if appended % 48 == 0 {
        print("encoded \(appended)/\(names.count)")
    }
}

input.markAsFinished()
let sem = DispatchSemaphore(value: 0)
writer.finishWriting { sem.signal() }
sem.wait()
if writer.status != .completed {
    fputs("writer failed: \(writer.error?.localizedDescription ?? "unknown")\n", stderr)
    exit(2)
}
let size = (try? fm.attributesOfItem(atPath: outURL.path)[.size] as? Int) ?? 0
print("wrote \(outURL.path) — \(size) bytes, \(appended) frames, \(width)x\(height) @ \(fps) fps")
