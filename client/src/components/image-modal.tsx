import React, { useState } from "react";
import {
  X,
  Download,
  Copy,
  Check,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";
import type { GalleryImage } from "@shared/schema";

interface ImageModalProps {
  image: GalleryImage;
  isOpen: boolean;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export function ImageModal({
  image,
  isOpen,
  onClose,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
}: ImageModalProps) {
  const [copied, setCopied] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!isOpen || !image) return null;

  const handleCopyLink = async () => {
    if (image.webViewLink) {
      try {
        await navigator.clipboard.writeText(image.webViewLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy link: ", err);
      }
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatFileSize = (bytes?: string) => {
    if (!bytes) return "Unknown";
    const size = parseInt(bytes, 10);
    if (isNaN(size)) return "Unknown";

    if (size === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-90 backdrop-blur-sm"
      onClick={onClose}
      data-testid="image-modal"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:rotate-90 bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm"
        data-testid="button-close-modal"
        aria-label="Close modal"
      >
        <X className="w-5 h-5 text-white" />
      </button>

      {hasPrev && onPrev && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-colors bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm"
          data-testid="button-prev-image"
          aria-label="Previous image"
        >
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      )}

      {hasNext && onNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-colors bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm"
          data-testid="button-next-image"
          aria-label="Next image"
        >
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      )}

      <div
        className="max-w-6xl max-h-[90vh] w-full flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full flex justify-center items-center mb-6">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <img
            src={`/api/gallery/images/${image.id}/content`}
            alt={image.name}
            className={`max-w-full max-h-[60vh] object-contain rounded-lg shadow-2xl transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(true)}
          />
        </div>

        <div className="w-full max-w-2xl bg-gray-900 bg-opacity-80 backdrop-blur-sm rounded-xl p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-white truncate">
                {image.name}
              </h3>
              {image.description && (
                <p className="text-sm text-gray-300 mt-1">
                  {image.description}
                </p>
              )}
            </div>
          </div>

          {(image.size || image.modifiedTime || image.mimeType) && (
            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-800 rounded-lg">
              {image.size && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">File Size</p>
                  <p className="font-medium text-white">
                    {formatFileSize(image.size)}
                  </p>
                </div>
              )}
              {image.modifiedTime && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Modified</p>
                  <p className="font-medium text-white">
                    {formatDate(image.modifiedTime)}
                  </p>
                </div>
              )}
              {image.mimeType && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Type</p>
                  <p className="font-medium text-white">{image.mimeType}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400 mb-1">ID</p>
                <p className="font-mono text-xs text-white truncate">
                  {image.id}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href={`/api/gallery/images/${image.id}/content`}
              download={image.name}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              data-testid="button-download-image"
            >
              <Download className="w-4 h-4" />
              Download
            </a>

            {image.webViewLink && (
              <>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all bg-gray-700 hover:bg-gray-600 text-white shadow-lg hover:shadow-xl"
                  data-testid="button-copy-link"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Link
                    </>
                  )}
                </button>

                <a
                  href={image.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  data-testid="button-open-image"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in Drive
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
