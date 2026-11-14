# X posts in MDX articles

Articles may use `.md` or `.mdx` without changing their extension-free URLs.
MDX inherits the site's Markdown processor, including footnotes and external-link handling.

Import `XPost` from `../../components/XPost.astro` in an MDX article. Pass the original
post URL as `url`, and include the quoted text, author, and date in its children.
The component emits X's official blockquote and asynchronous `widgets.js` script.
It does not request oEmbed data during builds or introduce a client framework.
The script is only emitted on pages that render the component. X availability,
privacy settings, or content blockers can prevent the enhanced widget from loading;
the quotation and source link remain readable without it.

## MDX-01: Article discovery and readable fallback

Given an MDX article containing an X post quotation,
when a reader browses the home page, article list, tag list, or RSS feed,
then the article is available at the same extension-free URL.

When JavaScript is disabled or the widget request fails,
then the quotation, attribution, source link, table, and footnote remain readable,
and the article fits mobile and desktop viewports.

The rendered blockquote and script URL follow the external X embed contract.
Automated tests block the third-party request rather than depend on X availability.

References:
- https://docs.x.com/x-for-websites/embedded-posts/overview
- https://docs.astro.build/en/guides/integrations-guide/mdx/
