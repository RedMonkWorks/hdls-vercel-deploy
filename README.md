## Run the Storefront Locally

For the initial build, In root Folder
```bash
npm run build --workspace=packages
npm install
npm run dev --workspace=site
```

If a build exists
```bash
cd site
npm run dev
```

### Swym Files

Javascript File:

root/site/lib

CSS File:

root/site/assets


### How to change providers

Open `site/.env.local` and change the value of `COMMERCE_PROVIDER` to the provider you would like to use, then set the environment variables for that provider (use `site/.env.template` as the base).

The setup for Shopify would look like this for example:

```
COMMERCE_PROVIDER=@vercel/commerce-shopify
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=xxxxxxx.myshopify.com
```
