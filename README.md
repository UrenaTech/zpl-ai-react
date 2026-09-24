# ZPL.AI libraries

Client libraries for the [ZPL.AI API](https://app.zpl.ai/api/scalar/), maintained by UrenaTech.

| Package | Description |
| --- | --- |
| [@urenatech/zpl-react](packages/react/README.md) | React components for barcode and ZPL label images. |

## Development

From the repository root:

```bash
npm ci
npm run check
npm pack --workspace @urenatech/zpl-react --dry-run
```

The React package lives in `packages/react`; its build, tests, and typecheck run through the root npm workspace. For the [React example](examples/react/), run `npm ci` and `npm run dev` in `examples/react` after building the package.

## License

MIT License. Copyright © 2026 UrenaTech LLC. See [LICENSE](LICENSE).
