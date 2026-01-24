import { createEditor } from './editor/index.js';
import { createToolbar } from './toolbar/index.js';
import './styles/main.css';
import './styles/editor.css';
import './styles/preview.css';
import './toolbar/toolbar.css';
import 'katex/dist/katex.min.css';
import initialContent from '../README.md?raw';

const container = document.getElementById('app');

// Create editor container structure
const wrapper = document.createElement('div');
wrapper.className = 'editor-wrapper';

const toolbarContainer = document.createElement('div');
toolbarContainer.className = 'toolbar-container';

const editorContainer = document.createElement('div');
editorContainer.className = 'editor-container';

wrapper.appendChild(toolbarContainer);
wrapper.appendChild(editorContainer);
container.appendChild(wrapper);

// Initialize editor
const editor = createEditor(editorContainer, initialContent);

// Create and attach toolbar
const toolbar = createToolbar(editor);
toolbarContainer.appendChild(toolbar);
