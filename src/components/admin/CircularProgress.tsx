import React from 'react'

interface CircularProgressProps {
 percentage: number
 size?: number
 strokeWidth?: number
 colorClass?: string
 bgClass?: string
 showText?: boolean
 textSizeClass?: string
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
 percentage,
 size = 54,
 strokeWidth = 5,
 colorClass = 'text-blue-500',
 bgClass = 'text-slate-800',
 showText = true,
 textSizeClass = 'text-xs'
}) => {
 const radius = (size - strokeWidth) / 2
 const circumference = radius * 2 * Math.PI
 const clamped = Math.max(0, Math.min(100, Math.round(percentage)))
 const offset = circumference - (clamped / 100) * circumference

 return (
 <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
 <svg width={size} height={size} className="transform -rotate-90">
 {/* Círculo de fondo */}
 <circle
 cx={size / 2}
 cy={size / 2}
 r={radius}
 stroke="currentColor"
 strokeWidth={strokeWidth}
 fill="transparent"
 className={bgClass}
 />
 {/* Círculo de progreso */}
 <circle
 cx={size / 2}
 cy={size / 2}
 r={radius}
 stroke="currentColor"
 strokeWidth={strokeWidth}
 fill="transparent"
 strokeDasharray={circumference}
 strokeDashoffset={offset}
 strokeLinecap="round"
 className={`${colorClass} transition-all duration-700 ease-out`}
 />
 </svg>
 {showText && (
 <span className={`absolute font-extrabold ${textSizeClass} text-slate-100`}>
 {clamped}%
 </span>
 )}
 </div>
 )
}
