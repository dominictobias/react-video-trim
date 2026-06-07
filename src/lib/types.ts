import type { CSSProperties } from 'react'

import type { VideoTrimLabelsProp } from './labels'

export type TrimRange = {
  startTime: number
  endTime: number
}

export type VideoTrimProps = {
  src: string | File | Blob
  onTrim: (range: TrimRange) => void
  onCancel?: () => void
  labels?: VideoTrimLabelsProp
  className?: string
  style?: CSSProperties
}

export type FilmstripProgress = {
  loaded: number
  total: number
}
