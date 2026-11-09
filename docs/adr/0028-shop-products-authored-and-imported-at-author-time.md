# Shop Products Are Authored in the Content Pack and Imported From Amazon at Author Time

The Shop's Products live in the Content Pack as plain files, like Lessons and Missions, so they can be added, reordered and retired over the air. Details of an Amazon Product (name, description, price, main picture) are extracted once by an authoring command, `content:shop-import`, which writes the Product folder for the author to review. The app never fetches, scrapes or refreshes Amazon data, and never calls an Amazon API. A Product's picture is copied into the pack, its price is shown as approximate with the month it was checked, and its buy link is held per language with no fallback to another language's link: a Product with no link in the user's language is hidden. Affiliate tags are per Amazon marketplace and are read from the author's local `.env.local`.

## Considered Options

- **Fetch Amazon details at runtime in the app**: rejected; Amazon blocks automated requests, markup changes without notice, its terms restrict scraping and showing cached prices, and every user would send Amazon requests from the app.
- **Amazon Product Advertising API**: deferred, not rejected; it needs an Associates account with qualifying sales. It can later sit behind the same import command without changing the pack format.
- **Write every Product by hand**: rejected; the author wants extraction. Manual Products stay first-class, and are the fallback whenever the import is blocked.
- **Fall back to the Spanish buy link when a language has none**: rejected; a link for one market is often unbuyable in another, so showing it would send users to a dead end.
- **One affiliate tag for all marketplaces**: rejected; tags are issued per marketplace.

## Policy, Image Rights, and Affiliate Tag Decision (Task 8.2)

- **Associates Policy & Image Rights**: The Amazon Associates Operating Agreement and Program Policies restrict caching or scraping product data and images for commercial affiliate display outside approved PA-API or SiteStripe mechanisms. Therefore, for the initial release and beta catalogue, all shipped products default to manual items (`source: manual`) using original, licensed photography.
- **Author Drafts**: The `npm run content:shop-import` CLI serves strictly as an author-time drafting aid. Authors must review extracted titles, write custom editorial descriptions in `<lang>.md`, and verify product photography rights before promoting imported items to stable channels.
- **Affiliate Tag Governance**: Tags are domain-specific (`AMAZON_AFFILIATE_TAG_ES`, `AMAZON_AFFILIATE_TAG_COM`, etc.) and loaded exclusively from `.env.local` during author-time execution, never bundled into the app binary or runtime code (`EXPO_PUBLIC_` prefix is strictly forbidden). Publishing Amazon products to stable is blocked until approved Associates account tags are configured and image licensing is confirmed.
