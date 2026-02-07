import React from "react";

const primaryColor = "#0d7377";

/**
 * Full-screen overlay with SVG animation for "extracting from email" state.
 */
export const ExtractFromEmailLoader: React.FC = () => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(255, 255, 255, 0.85)",
        borderRadius: 12,
        zIndex: 10,
        gap: 24,
      }}
    >
      <svg
        width={120}
        height={100}
        viewBox="0 0 120 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient
            id="extract-gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={primaryColor} stopOpacity={0.9} />
            <stop offset="100%" stopColor={primaryColor} stopOpacity={0.5} />
          </linearGradient>
          <filter id="extract-glow">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Document / email shape */}
        <path
          d="M20 12 L20 88 L100 88 L100 12 L60 12 L55 8 L20 8 Z"
          stroke="url(#extract-gradient)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            filter: "url(#extract-glow)",
            animation: "extract-pulse 2s ease-in-out infinite",
          }}
        />
        {/* Animated scan line */}
        <line
          x1="28"
          y1="24"
          x2="92"
          y2="24"
          stroke={primaryColor}
          strokeWidth="1.5"
          strokeDasharray="4 3"
          opacity={0.8}
          style={{
            animation: "extract-scan 1.8s ease-in-out infinite",
          }}
        />
        {/* Content lines (static, subtle) */}
        <line
          x1="28"
          y1="38"
          x2="70"
          y2="38"
          stroke={primaryColor}
          strokeWidth="1"
          opacity={0.35}
        />
        <line
          x1="28"
          y1="48"
          x2="80"
          y2="48"
          stroke={primaryColor}
          strokeWidth="1"
          opacity={0.35}
        />
        <line
          x1="28"
          y1="58"
          x2="65"
          y2="58"
          stroke={primaryColor}
          strokeWidth="1"
          opacity={0.35}
        />
        {/* Floating dots */}
        <circle
          cx="75"
          cy="52"
          r="3"
          fill={primaryColor}
          opacity={0.6}
          style={{ animation: "extract-dot 1.2s ease-in-out infinite" }}
        />
        <circle
          cx="82"
          cy="58"
          r="2.5"
          fill={primaryColor}
          opacity={0.5}
          style={{
            animation: "extract-dot 1.2s ease-in-out 0.2s infinite",
          }}
        />
        <circle
          cx="78"
          cy="66"
          r="2"
          fill={primaryColor}
          opacity={0.4}
          style={{
            animation: "extract-dot 1.2s ease-in-out 0.4s infinite",
          }}
        />
      </svg>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 500,
            color: "rgba(0,0,0,0.75)",
            marginBottom: 4,
          }}
        >
          Extracting from email…
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: primaryColor,
                opacity: 0.7,
                animation: "extract-bounce 0.6s ease-in-out infinite",
                animationDelay: `${i * 0.12}s`,
              }}
            />
          ))}
        </div>
      </div>
      <style>{`
        @keyframes extract-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.75; }
        }
        @keyframes extract-scan {
          0% { transform: translateY(0); opacity: 0.9; }
          50% { transform: translateY(48px); opacity: 0.6; }
          100% { transform: translateY(0); opacity: 0.9; }
        }
        @keyframes extract-dot {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.2); opacity: 0.9; }
        }
        @keyframes extract-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
};

export default ExtractFromEmailLoader;
