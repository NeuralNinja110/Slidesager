# Slidesager - AI-Powered PowerPoint Generator

Transform your text, markdown, or prose into beautiful PowerPoint presentations using AI and Marp. Slidesager automatically analyzes your content, extracts styles from uploaded templates, and generates professional presentations with intelligent slide structuring.

## Features

- **AI Content Analysis**: Uses OpenAI, Anthropic (Claude), or Google (Gemini) to intelligently break down text into slide content
- **Template Style Extraction**: Analyzes uploaded PowerPoint templates to preserve colors, fonts, and layouts
- **Marp Integration**: Generates presentations using Marp for consistent, high-quality output
- **Live Preview**: See your presentation as it's being generated with embedded HTML preview
- **Selective Download**: Download specific slides or ranges in PPTX or PDF format
- **Modern UI**: Beautiful, responsive interface with dark/light mode support
- **Secure**: API keys are never stored or logged

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Marp CLI (`npm install -g @marp-team/marp-cli`)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/slidesager.git
cd slidesager
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Fill in your API keys in the `.env` file.

4. Start the development server:
```bash
npm run dev
```

Visit `http://localhost:5173` to use the application.

## Environment Variables

Create a `.env` file with the following variables:

```env
# At least one of these AI provider API keys is required
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here  
GEMINI_API_KEY=your_gemini_api_key_here

# Optional
NODE_ENV=development
```

## Usage

1. **Choose AI Provider**: Select from OpenAI (GPT), Anthropic (Claude), or Google (Gemini)
2. **Upload Template** (Optional): Upload a PPTX file to extract colors and styling
3. **Input Content**: Paste your text, markdown, or prose content
4. **Generate**: Click generate to create your presentation
5. **Preview & Download**: View the live preview and download selected slides

## API Endpoints

- `GET /api/presentations` - List recent presentations
- `POST /api/presentations/generate` - Generate new presentation
- `GET /api/presentations/:id/preview` - Get HTML preview
- `POST /api/presentations/:id/download/:format` - Download presentation

## Architecture

- **Frontend**: React with TypeScript, TailwindCSS, Radix UI
- **Backend**: Express.js with TypeScript
- **AI Integration**: OpenAI, Anthropic, Google Generative AI
- **Presentation Engine**: Marp CLI for HTML, PPTX, PDF generation
- **Storage**: In-memory (development), easily extensible to database

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions on Vercel.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests if applicable
5. Commit your changes: `git commit -am 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Acknowledgments

- [Marp](https://marp.app/) for the amazing presentation framework
- [OpenAI](https://openai.com/), [Anthropic](https://anthropic.com/), and [Google](https://ai.google/) for AI capabilities
- [Radix UI](https://radix-ui.com/) for beautiful, accessible components
