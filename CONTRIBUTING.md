# Contributing to Namecheap Domains MCP

Thank you for considering contributing to this project! This document outlines the guidelines for contributing to the Namecheap Domains MCP for Cursor.

## Code of Conduct

Please be respectful and considerate of others when contributing to this project. We aim to foster an inclusive and welcoming community.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with the following information:

1. A clear, descriptive title
2. Steps to reproduce the bug
3. Expected behavior
4. Actual behavior
5. Any error messages or logs
6. Your environment (Node.js version, OS, etc.)

### Suggesting Features

Feature suggestions are welcome! Please create an issue with:

1. A clear, descriptive title
2. A detailed description of the proposed feature
3. Any relevant examples or mockups
4. Why this feature would be useful to the project

### Pull Requests

We welcome pull requests for bug fixes, features, and improvements. To submit a pull request:

1. Fork the repository
2. Create a new branch for your changes
3. Make your changes following the code style guidelines
4. Add tests if applicable
5. Update documentation as needed
6. Submit a pull request with a clear description of the changes

## Development Setup

1. Clone the repository
2. Install dependencies with `npm install`
3. Create a `.env` file based on `.env.example`
4. Create a `registrant-profile.json` file based on `registrant-profile.example.json`
5. Build the project with `npm run build`

## Testing

Before submitting your changes, please run:

1. The TypeScript compiler with `npm run build`
2. The test script with `node test-features.js`

## Code Style Guidelines

- Use TypeScript for all new code
- Follow the existing code style and formatting
- Include comments for complex logic
- Use meaningful variable and function names
- Keep functions small and focused

## Documentation

Please update the README.md and other documentation when making changes to the codebase.

## Security Considerations

Because this project handles domain registration and can make purchases:

1. Never commit API credentials or personal information
2. Be careful with features that could lead to accidental purchases
3. Always maintain the two-step confirmation process for domain registration

## License

By contributing to this project, you agree that your contributions will be licensed under the project's MIT license. 