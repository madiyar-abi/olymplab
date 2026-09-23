import { VisualizersGalleryClient } from './VisualizersGalleryClient'

export const metadata = {
  title: 'Algorithm Visualizer Lab | OlympLab',
  description: 'Interactive algorithm and data structure visualizer sandboxes for competitive programmers.'
}

export default function VisualizersPage() {
  return <VisualizersGalleryClient />
}
