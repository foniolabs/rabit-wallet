import { useMDXComponents as getDocsMDXComponents } from 'nextra-theme-docs'
import { Hero, FeatureGrid, Feature, InstallTabs, Note, PropTable } from './components/mdx'

const docsComponents = getDocsMDXComponents()

export function useMDXComponents(components?: Record<string, unknown>) {
  return {
    ...docsComponents,
    Hero,
    FeatureGrid,
    Feature,
    InstallTabs,
    Note,
    PropTable,
    ...components,
  }
}
