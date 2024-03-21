import React, { useCallback, useEffect } from 'react';
import { Handle, Position, useReactFlow, useStore, useStoreApi } from 'reactflow';

import { ComponentItem, PipelineComponent, generateUIFormComponent, onChange, renderComponentUI, renderHandle, setDefaultConfig } from '@amphi/pipeline-components-manager';
import { fileTextIcon } from '../icons';

export class CsvFileInput extends PipelineComponent<ComponentItem>() {

  public _name = "CSV File Input";
  public _id = "csvFileInput";
  public _type = "pandas_df_input";
  public _fileDrop = [ "csv", "tsv" ];
  public _category = "input";
  public _icon = fileTextIcon;
  public _default = { csvOptions: { sep: "," } };
  public _form = {
    idPrefix: "component__form",
    fields: [
      {
        type: "file",
        label: "File path",
        id: "filePath",
        placeholder: "Type file name",
        validation: "\\.(csv|tsv|txt)$",
        validationMessage: "This field expects a file with a csv, tsv or txt extension such as input.csv."
      },
      {
        type: "singleInputCreatableSelect",
        label: "Separator",
        id: "csvOptions.sep",
        placeholder: "default: ,",
        options: [
          { value: "null", label: "Select or type delimiter", isDisabled: true },
          { value: ",", label: "comma (,)" },
          { value: ";", label: "semicolon (;)" },
          { value: " ", label: "space" },
          { value: "  ", label: "tab" },
          { value: "|", label: "pipe (|)" },
          { value: "infer", label: "infer (tries to auto detect)" }
        ],
      },
      {
        type: "input",
        label: "Header",
        id: "csvOptions.header",
        placeholder: "infer",
        advanced: true
      },
      {
        type: "singleInputSelect",
        label: "On Bad Lines",
        id: "csvOptions.on_bad_lines",
        placeholder: "error",
        options: [
          { value: "error", label: "Error: raise an Exception when a bad line is encountered" },
          { value: "warn", label: "Warn: raise a warning when a bad line is encountered and skip that line." },
          { value: "skip", label: "Skip: skip bad lines without raising or warning when they are encountered." }
        ],
        advanced: true
      },
      {
        type: "boolean",
        label: "Verbose",
        id: "csvOptions.verbose",
        placeholder: "false",
        advanced: true
      },
    ],
  };

  public static ConfigForm = ({
    nodeId,
    data,
    context,
    manager,
    commands,
    store,
    setNodes
  }) => {
    const defaultConfig = this.Default; // Define your default config

    const handleSetDefaultConfig = useCallback(() => {
      setDefaultConfig({ nodeId, store, setNodes, defaultConfig });
    }, [nodeId, store, setNodes, defaultConfig]);

    useEffect(() => {
      handleSetDefaultConfig();
    }, [handleSetDefaultConfig]);

    const handleChange = useCallback((evtTargetValue: any, field: string) => {
      onChange({ evtTargetValue, field, nodeId, store, setNodes });
    }, [nodeId, store, setNodes]);

    return (
      <>
        {generateUIFormComponent({
          nodeId: nodeId,
          type: this.Type,
          name: this.Name,
          form: this.Form,
          data: data,
          context: context,
          manager: manager,
          commands: commands,
          handleChange: handleChange,
        })}
      </>
    );
  }

  public UIComponent({ id, data, context, manager, commands }) {

    const { setNodes, deleteElements, setViewport } = useReactFlow();
    const store = useStoreApi();

    const deleteNode = useCallback(() => {
      deleteElements({ nodes: [{ id }] });
    }, [id, deleteElements]);

    const zoomSelector = (s) => s.transform[2] >= 1;
    const showContent = useStore(zoomSelector);

    // Create the handle element
    const handleElement = React.createElement(renderHandle, {
      type: CsvFileInput.Type,
      Handle: Handle, // Make sure Handle is imported or defined
      Position: Position // Make sure Position is imported or defined
    });

    return (
      <>
        {renderComponentUI({
          id: id,
          data: data,
          context: context,
          manager: manager,
          commands: commands,
          name: CsvFileInput.Name,
          ConfigForm: CsvFileInput.ConfigForm({ nodeId: id, data, context, manager, commands, store, setNodes }),
          Icon: CsvFileInput.Icon,
          showContent: showContent,
          handle: handleElement,
          deleteNode: deleteNode,
          setViewport: setViewport,
        })}
      </>
    );
  }

  public provideImports({ config }): string[] {
    return ["import pandas as pd"];
  }

  public generateComponentCode({ config, outputName }): string {
    // Initialize an object to modify without affecting the original config
    let csvOptions = { ...config.csvOptions };

    // Special handling for 'infer' option
    if (csvOptions.sep === 'infer') {
      csvOptions.sep = 'None'; // Set sep to Python's None for code generation
      csvOptions.engine = 'python'; // Ensure engine is set to 'python'
    }

    // Prepare options string for pd.read_csv
    let optionsString = Object.entries(csvOptions)
      .filter(([key, value]) => value !== null && value !== '' && !(key === 'sep' && value === 'infer'))
      .map(([key, value]) => {
        // Correct handling for Python's None without quotes
        if (value === 'None') {
          return `${key}=${value}`;
        } else {
          // Handle other options normally
          return `${key}='${value}'`;
        }
      })
      .join(', ');

    // Generate the Python code
    const code = `
# Reading data from ${config.filePath}
${outputName} = pd.read_csv('${config.filePath}'${optionsString ? `, ${optionsString}` : ''}).convert_dtypes()
`;
    return code;
  }

}
