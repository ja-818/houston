export default function (eleventyConfig) {
  // Pass through static assets unchanged
  eleventyConfig.addPassthroughCopy("src/favicon.svg");
  eleventyConfig.addPassthroughCopy("src/houston-black.svg");
  eleventyConfig.addPassthroughCopy("src/houston-gray.svg");
  eleventyConfig.addPassthroughCopy("src/icons");
  eleventyConfig.addPassthroughCopy("src/learn/style.css");
  eleventyConfig.addPassthroughCopy("src/slack");
  eleventyConfig.addPassthroughCopy("src/_headers");

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
    },
    // Use Nunjucks for HTML files
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
