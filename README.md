# ZPL.AI libraries

Client libraries for the [ZPL.AI API](https://app.zpl.ai/api/scalar/), maintained by UrenaTech.

| Package | Description |
| --- | --- |
| [@urenatech/zpl-react](packages/react/README.md) | React components for barcode and ZPL label images. |
| [@urenatech/zpl-angular](packages/angular/README.md) | Standalone Angular components for barcode and ZPL label images. |
| [@urenatech/zpl-core](packages/core/README.md) | Shared browser API client and image utilities used by both libraries. |

## Development

From the repository root:

```bash
npm ci
npm run check
npm pack --workspace @urenatech/zpl-core --dry-run
npm pack --workspace @urenatech/zpl-react --dry-run
npm pack ./packages/angular/dist --dry-run
```

The shared client lives in `packages/core`; React and Angular live in `packages/react` and `packages/angular`. `npm run check` builds the core first, then verifies both framework packages. For the [React example](examples/react/), run `npm ci` and `npm run dev` in `examples/react` after building the packages.

## License

MIT License. Copyright © 2026 UrenaTech LLC. See [LICENSE](LICENSE).
