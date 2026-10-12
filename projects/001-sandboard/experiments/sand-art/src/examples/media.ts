// Actual canvas screenshots at gallery size; full PNG exports remain in assets.
const images = import.meta.glob('../../../../assets/handdraw-examples/previews/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
export const examplePreview = (id: string) => images[`../../../../assets/handdraw-examples/previews/${id}.png`]
