export { Hero } from './Hero'
export { FeatureGrid, Feature } from './FeatureGrid'
export { InstallTabs } from './InstallTabs'
export { Note } from './Note'
export { PropTable, type PropRow } from './PropTable'

import { Hero } from './Hero'
import { FeatureGrid, Feature } from './FeatureGrid'
import { InstallTabs } from './InstallTabs'
import { Note } from './Note'
import { PropTable } from './PropTable'

/**
 * Components available globally inside every .mdx file under `pages/`.
 * Imported by Nextra via `theme.config.tsx#components`.
 */
export const mdxComponents = {
  Hero,
  FeatureGrid,
  Feature,
  InstallTabs,
  Note,
  PropTable,
}
