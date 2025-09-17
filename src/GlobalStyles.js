// This file defines global CSS styles that apply to the entire application.
// It uses styled-components' createGlobalStyle utility for this purpose.
import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  /* Universal box-sizing for consistent layout. This makes an element's padding
     and border part of its total width and height, which simplifies layout calculations. */
  *, *::before, *::after {
    box-sizing: border-box;
  }

  /*
   * Base styles for the body of the application.
   */
  body {
    /* Remove default browser margins and padding */
    margin: 0;
    padding: 0;
    /* Define a clean, cross-platform font stack */
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    /* Improve font rendering on different operating systems */
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    /* Set a larger, more readable base font size for the entire app */
    font-size: 18px;
    /* Set default text and background colors */
    color: #333;
    background-color: #f5f6f8;
  }

  /* Style for code blocks, ensuring they use a monospace font */
  code {
    font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
      monospace;
  }

  /* Reset default button styles for better consistency across browsers */
  button {
    cursor: pointer;
    font-size: 1em;
  }

  /* Reset default link styles, removing the underline and inheriting color */
  a {
    text-decoration: none;
    color: inherit;
  }
`;

export default GlobalStyles;