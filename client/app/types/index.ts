// types/index.ts
export interface Image {
    src: string
    description: string
  }
  
  export interface Slide {
    title: string
    template_id: number
    texts?: string[]
    speaker_notes?: string
    images?: Image[]
    image?: string // For backward compatibility
  }
  
  export interface Lecture {
    title: string
    description: string
    slides: Slide[]
    video_id: string
    topic: string
  }
  
  export interface MessageTranscript {
    role: 'user' | 'ai'
    content: string
  }
  
  export interface FunctionCall {
    name: string
    arguments: any
    is_function?: boolean
  }