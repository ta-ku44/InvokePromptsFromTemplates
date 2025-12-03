import { Autocomplete, TextField } from "@mui/material";
import type { Template } from "../types";
import { createRoot } from 'react-dom/client';
import { loadStoredData } from "../utils/storage";
import { handleTemplateSelect } from "./index";

interface Props {
  query: string;
  templates: Template[];
  onSelect: (template: Template) => void;
}

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

const showAutocomplete = async (query: string, currentTextArea: HTMLElement | null ) => {
  const data = await loadStoredData();
  const templates = data.templates.filter(t => 
    t.name.toLowerCase().includes(query.toLowerCase())
  );

  if (templates.length === 0) { console.log('該当するテンプレートがありません'); hideAutocomplete(); return; }

  console.log('現在該当中のテンプレート:', templates);
  if (!container) {
    container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.zIndex = '10000';
    document.body.appendChild(container);
  }
  if (currentTextArea) {
    const rect = currentTextArea.getBoundingClientRect();
    container.style.top = `${rect.bottom + window.scrollY}px`;
    container.style.left = `${rect.left + window.scrollX}px`;
    container.style.width = `${rect.width}px`;
  }
  if (!root) {
    root = createRoot(container);
  }
  root.render(<TemplateAutoComplete
    query={query}
    templates={templates}
    onSelect={handleTemplateSelect}
  />);
}

const hideAutocomplete = () => {
  if (root) root.unmount();
  if (container) {
    container.remove();
    container = null;
  }
  root = null;
}

function TemplateAutoComplete({ query, templates, onSelect }: Props) {
  return (
    <Autocomplete
      open={true}
      options={templates}
      getOptionLabel={(option) => option.name}
      inputValue={query}
      onChange={(_, value) => {
        if (value) onSelect(value);
      }}
      renderInput={(params) => (
        <TextField {...params} autoFocus size="small" />
      )}
    />
  );
}

export { showAutocomplete, hideAutocomplete };
export default TemplateAutoComplete;