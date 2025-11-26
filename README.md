# Pesto For All - Jekyll Static Site

This is the Jekyll-powered static website for Pesto For All, converted from a Shopify theme for hosting on GitHub Pages.

## Quick Start

### Prerequisites
- Ruby (2.7 or higher)
- Bundler (`gem install bundler`)

### Local Development

1. **Install dependencies:**
   ```bash
   bundle install
   ```

2. **Run the site locally:**
   ```bash
   bundle exec jekyll serve
   ```

3. **View the site:**
   Open http://localhost:4000 in your browser

4. **Live reload:**
   The site will automatically reload when you make changes to files.

## Site Structure

```
/
├── _config.yml              # Site configuration (colors, fonts, contact info)
├── _layouts/                # Page templates
│   └── default.html        # Main layout
├── _includes/               # Reusable components
│   ├── header.html         # Site header/navigation
│   ├── footer.html         # Site footer
│   ├── hero.html           # Homepage hero section
│   └── ...                 # Other sections
├── _recipes/                # Recipe collection (markdown files)
│   ├── pesto-toast.md
│   ├── pizza.md
│   └── ...
├── assets/
│   ├── css/                # Stylesheets
│   ├── js/                 # JavaScript
│   └── images/             # Images
├── index.html               # Homepage
├── recipes.html             # Recipes listing page
└── where-to-find-us.html   # Store locations page
```

## Configuration

### Site Settings
Edit `_config.yml` to update:
- Site title, description, email
- Instagram username
- Google Maps API key
- Colors (update CSS variables)
- Fonts

### Newsletter Form (Kit/ConvertKit)
1. Create a form in your Kit account
2. Get your form ID
3. Update `_includes/modal.html`:
   - Replace `YOUR_FORM_ID` with your actual form ID (appears 3 times)

### Adding/Editing Recipes
Recipes are stored as markdown files in `_recipes/`:

1. Create a new file: `_recipes/my-recipe.md`
2. Add front matter and content:
   ```markdown
   ---
   title: My Recipe Name
   image: /assets/images/my-recipe.jpg  # Optional
   recipe_link: https://external-recipe.com  # Optional
   order: 8  # Display order
   ---

   Recipe description goes here...
   ```

3. The recipe will automatically appear on the recipes page!

## Deployment to GitHub Pages

### Option 1: Direct Push (Easiest)
1. Push to your GitHub repository
2. Go to Settings → Pages
3. Select branch: `main`
4. GitHub will automatically build and deploy

### Option 2: Custom Domain
1. Add a `CNAME` file with your domain
2. Configure DNS:
   - Add CNAME record pointing to `username.github.io`
3. Enable HTTPS in GitHub Pages settings

## What Changed from Shopify

### Removed:
- All product listings and e-commerce functionality
- Shopping cart
- Shipping FAQ page
- Shopify-specific Liquid tags

### Kept:
- All branding, design, and styling
- Homepage sections (hero, farm, inspiration, about, Instagram)
- Recipes page (now easier to edit!)
- Where to Find Us page
- Newsletter signup (now using Kit)

### Improved:
- Recipes are now individual markdown files (much easier to add/edit)
- No monthly Shopify fees
- Faster load times
- Full control over hosting

## Troubleshooting

### Jekyll not found
```bash
gem install jekyll bundler
```

### Bundle install fails
```bash
bundle update
```

### Port already in use
```bash
bundle exec jekyll serve --port 4001
```

## Support

For questions or issues:
- Email: hello@pestoforall.co
- Instagram: @pesto_for_all

---

Made with ❤️ in Missouri
