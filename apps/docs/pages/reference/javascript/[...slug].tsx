import { useEffect, useState } from 'react'

import fs from 'fs'
import toc from 'markdown-toc'

import matter from 'gray-matter'
import { MDXRemote } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'
import components from '~/components/index'
import { getAllDocs, getDocsBySlug } from '~/lib/docs'

import ReactMarkdown from 'react-markdown'

// @ts-ignore
import jsTypeSpec from '~/../../spec/enrichments/tsdoc_v2/combined.json'
// @ts-ignore
import examples from '~/../../spec/examples/examples.yml' assert { type: 'yml' }
// @ts-expect-error
import jsSpec from '~/../../spec/supabase_js_v2_temp_new_shape.yml' assert { type: 'yml' }
// @ts-expect-error
import commonLibSpec from '~/../../spec/common-client-libs.yml' assert { type: 'yml' }

import { Button, IconChevronRight, IconDatabase, Tabs } from 'ui'
import CodeBlock from '~/components/CodeBlock/CodeBlock'

import { useRouter } from 'next/router'
import { extractTsDocNode, generateParameters } from '~/lib/refGenerator/helpers'
import Param from '~/components/Params'
import Options from '~/components/Options'
import RefSubLayout from '~/layouts/ref/RefSubLayout'

import OldLayout from '~/layouts/Default'

import * as Collapsible from '@radix-ui/react-collapsible'
import * as Accordion from '@radix-ui/react-collapsible'

export default function JSReference(props) {
  const router = useRouter()

  const slug = router.query.slug[0]

  const isNewDocs = process.env.NEXT_PUBLIC_NEW_DOCS === 'true'

  // When user lands on a url like http://supabase.com/docs/reference/javascript/sign-up
  // find the #sign-up element and scroll to that
  useEffect(() => {
    if (isNewDocs && document && slug !== 'start') {
      document.querySelector(`#${slug}`) && document.querySelector(`#${slug}`).scrollIntoView()
    }
  })

  /*
   * handle old ref pages
   */
  if (!isNewDocs) {
    return (
      // @ts-ignore
      <OldLayout meta={props.meta} toc={props.toc}>
        <MDXRemote {...props.content} components={components} />
      </OldLayout>
    )
  }

  return (
    <>
      <div>~~~Preamble pages~~~</div>
      {props.docs
        .filter((doc) => doc.preamblePage)
        .map((item) => (
          <MDXRemote {...item.content} components={components} />
        ))}
      <RefSubLayout>
        {jsSpec.functions.map((item, itemIndex) => {
          const hasTsRef = item['$ref'] || null
          const tsDefinition = hasTsRef && extractTsDocNode(hasTsRef, jsTypeSpec)
          const parameters = hasTsRef ? generateParameters(tsDefinition) : ''

          const functionMarkdownContent = props?.docs[itemIndex]?.content
          const shortText = hasTsRef ? tsDefinition.signatures[0].comment.shortText : ''

          // const introFileMarkdownContent =
          console.log('props.docs', props.docs)
          // if (item.id !== 'db-modifiers-select') return <></>

          return (
            <>
              <RefSubLayout.Section
                key={item.id}
                title={
                  examples.functions[itemIndex].title ??
                  examples.functions[itemIndex].id ??
                  item.name ??
                  item.id
                }
                id={item.id}
                slug={commonLibSpec.functions.find((commonItem) => commonItem.id === item.id).slug}
                scrollSpyHeader={true}
              >
                <RefSubLayout.Details>
                  <>
                    <header className={['mb-16'].join(' ')}>
                      {shortText && <ReactMarkdown className="text-sm">{shortText}</ReactMarkdown>}
                    </header>

                    {item.description && (
                      <div className="prose">
                        <ReactMarkdown className="text-sm">{item.description}</ReactMarkdown>
                      </div>
                    )}
                    {functionMarkdownContent && (
                      <div className="prose">
                        <MDXRemote {...functionMarkdownContent} components={components} />
                      </div>
                    )}
                    {item.notes && (
                      <div className="prose">
                        <ReactMarkdown className="text-sm">{item.notes}</ReactMarkdown>
                      </div>
                    )}
                    {/* // parameters */}
                    {parameters && (
                      <div className="not-prose mt-12">
                        <h5 className="mb-3 text-base text-scale-1200">Parameters</h5>
                        <ul className="">
                          {parameters.map((param) => {
                            // grab override params from yaml file
                            const overrideParams = item.overrideParams

                            // params from the yaml file can override the params from parameters if it matches the name
                            const overide = overrideParams?.filter((x) => {
                              return param.name === x.name
                            })

                            const paramItem = overide?.length > 0 ? overide[0] : param

                            return (
                              <Param {...paramItem}>
                                {paramItem.subContent && (
                                  <div className="mt-3">
                                    <Options>
                                      {param.subContent.map((param) => {
                                        return <Options.Option {...param} />
                                      })}
                                    </Options>
                                  </div>
                                )}
                              </Param>
                            )
                          })}
                        </ul>
                      </div>
                    )}
                  </>
                </RefSubLayout.Details>
                <RefSubLayout.Examples>
                  {item.examples && (
                    <>
                      <Tabs
                        defaultActiveId={item.examples[0].id}
                        size="tiny"
                        type="rounded-pills"
                        scrollable
                      >
                        {item.examples &&
                          item.examples.map((example, exampleIndex) => {
                            const exampleString = `
import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
const supabase = createClient('https://xyzcompany.supabase.co', 'public-anon-key')
`
                            const currentExampleId = example.id
                            const staticExample = item.examples[exampleIndex]

                            const response = staticExample.response
                            const sql = staticExample?.data?.sql
                            const tables = staticExample?.data?.tables

                            return (
                              <Tabs.Panel
                                id={example.id}
                                label={example.name}
                                className="flex flex-col gap-3"
                              >
                                <Accordion.Root className="transition-all ease-out flex flex-col">
                                  <Accordion.Trigger asChild>
                                    <button
                                      className={[
                                        'transition-all ease-out',
                                        'h-8',
                                        'bg-scale-300 data-open:bg-scale-500',
                                        'border border-scale-500 w-full flex items-center gap-3 px-5',
                                        'data-open:bg-yellow-900',
                                        'rounded-tl rounded-tr',
                                        'data-closed:rounded-bl data-closed:rounded-br',
                                        'text-scale-1100 text-xs',
                                      ].join(' ')}
                                    >
                                      <div className="data-open-parent:rotate-90 text-scale-900">
                                        <IconChevronRight size={12} strokeWidth={2} />
                                      </div>
                                      Example data source
                                    </button>
                                  </Accordion.Trigger>
                                  <Accordion.Content className="transition data-open:animate-slide-down data-closed:animate-slide-up">
                                    {tables &&
                                      tables.length > 0 &&
                                      tables.map((table) => {
                                        return (
                                          <div className="bg-scale-300 border rounded prose max-w-none">
                                            <div className="bg-scale-200 px-5 py-2">
                                              <div className="flex gap-2 items-center">
                                                <div className="text-brand-900">
                                                  <IconDatabase size={16} />
                                                </div>
                                                <h5 className="text-xs text-scale-1200">
                                                  {table.name}
                                                </h5>
                                              </div>
                                            </div>
                                          </div>
                                        )
                                      })}
                                    {sql && (
                                      <CodeBlock
                                        className="useless-code-block-class my-0 border border-scale-500 !rounded-tl-none !rounded-tr-none"
                                        language="sql"
                                        hideLineNumbers={true}
                                      >
                                        {sql}
                                      </CodeBlock>
                                    )}
                                  </Accordion.Content>
                                </Accordion.Root>
                                <CodeBlock
                                  className="useless-code-block-class"
                                  language="js"
                                  hideLineNumbers={true}
                                >
                                  {exampleString +
                                    (example.code &&
                                      example.code
                                        .replace('```', '')
                                        .replace('js', '')
                                        .replace('```', ''))}
                                </CodeBlock>
                                {response && (
                                  <CodeBlock
                                    className="useless-code-block-class"
                                    language="json"
                                    hideLineNumbers={true}
                                  >
                                    {response}
                                  </CodeBlock>
                                )}
                              </Tabs.Panel>
                            )
                          })}
                      </Tabs>
                    </>
                  )}
                </RefSubLayout.Examples>
              </RefSubLayout.Section>
            </>
          )
        })}
      </RefSubLayout>
    </>
  )
}

export async function getStaticProps({ params }: { params: { slug: string[] } }) {
  const preamblePages = ['typescript-support', 'release-notes']

  const specPpages = jsSpec.functions.map((x) => x.id)

  const pages = [...preamblePages, ...specPpages]

  /**
   * Read all the markdown files that might have
   *  - custom text
   *  - call outs
   *  - important notes regarding implementation
   */
  const allMarkdownDocs = await Promise.all(
    pages.map(async (x, i) => {
      const pathName = `docs/ref/js/${x}.mdx`

      function checkFileExists(x) {
        // console.log('checking this ', x)
        if (fs.existsSync(x)) {
          return true
        } else {
          return false
        }
      }

      const markdownExists = checkFileExists(pathName)

      const fileContents = markdownExists ? fs.readFileSync(pathName, 'utf8') : ''
      const { data, content } = matter(fileContents)

      return {
        id: x,
        title: x,
        // ...content,
        meta: data,
        preamblePage: preamblePages.includes(x),
        content: content ? await serialize(content || '') : null,
      }
    })
  )

  /*
   * old content generation
   * this is for grabbing to old markdown files
   */

  let slug
  if (params.slug.length > 1) {
    slug = `docs/reference/javascript/${params.slug.join('/')}`
  } else {
    slug = `docs/reference/javascript/${params.slug[0]}`
  }

  /*
   * handle old ref pages
   */
  if (process.env.NEXT_PUBLIC_NEW_DOCS === 'false') {
    let doc = getDocsBySlug(slug)
    const content = await serialize(doc.content || '')
    return {
      props: {
        /*
         * old reference docs are below
         */
        ...doc,
        content,
        toc: toc(doc.content, { maxdepth: 1, firsth1: false }),
      },
    }
  } else {
    return {
      props: {
        docs: allMarkdownDocs,
      },
    }
  }
}

export function getStaticPaths() {
  let docs = getAllDocs()

  return {
    paths: docs.map(() => {
      return {
        params: {
          slug: docs.map((d) => d.slug),
        },
      }
    }),
    fallback: 'blocking',
  }
}