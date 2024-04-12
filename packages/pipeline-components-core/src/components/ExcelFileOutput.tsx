import { ComponentItem, PipelineComponent, generateUIFormComponent, onChange, renderComponentUI, renderHandle, setDefaultConfig } from '@amphi/pipeline-components-manager';
import React, { useCallback, useEffect } from 'react';
import { Handle, Position, useReactFlow, useStore, useStoreApi } from 'reactflow';
import { filePlusIcon } from '../icons';

export class ExcelFileOutput extends PipelineComponent<ComponentItem>() {

  public _name = "Excel File Output";
  public _id = "excelFileOutput";
  public _type = "pandas_df_output";
  public _category = "output";
  public _icon = filePlusIcon;
  public _default = { excelOptions: {} };
  public _form = {
    idPrefix: "component__form",
    fields: [
      {
        type: "file",
        label: "File path",
        id: "filePath",
        placeholder: "Type file name",
        validation: "\\.(xlsx)$",
        validationMessage: "This field expects a file with a xlsx extension such as output.xlsx."
      },
      {
        type: "input",
        label: "Sheet",
        id: "excelOptions.sheet",
        placeholder: "default: Sheet1"
      },
      {
        type: "radio",
        label: "Mode",
        id: "mode",
        options: [
          { value: "write", label: "Write"},
          { value: "append", label: "Append" }
        ],
        advanced: true
      },
    ],
  };


  public static ConfigForm = ({
    nodeId,
    data,
    context,
    componentService,
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
          componentService: componentService,
          manager: manager,
          commands: commands,
          handleChange: handleChange,
        })}
      </>
    );
  }

  public UIComponent({ id, data, context, componentService, manager, commands }) {

    const { setNodes, deleteElements, setViewport } = useReactFlow();
    const store = useStoreApi();

    const deleteNode = useCallback(() => {
      deleteElements({ nodes: [{ id }] });
    }, [id, deleteElements]);

  const zoomSelector = (s) => s.transform[2] >= 1;
  const showContent = useStore(zoomSelector);
  
  const selector = (s) => ({
    nodeInternals: s.nodeInternals,
    edges: s.edges,
  });

  const { nodeInternals, edges } = useStore(selector);
  const nodeId = id;
  const internals = { nodeInternals, edges, nodeId }


    // Create the handle element
    const handleElement = React.createElement(renderHandle, {
      type: ExcelFileOutput.Type,
      Handle: Handle, // Make sure Handle is imported or defined
      Position: Position, // Make sure Position is imported or defined
      internals: internals    
    });

    return (
      <>
        {renderComponentUI({
          id: id,
          data: data,
          context: context,
          manager: manager,
          commands: commands,
          name: ExcelFileOutput.Name,
          ConfigForm: ExcelFileOutput.ConfigForm({ nodeId: id, data, context, componentService, manager, commands, store, setNodes }),
          Icon: ExcelFileOutput.Icon,
          showContent: showContent,
          handle: handleElement,
          deleteNode: deleteNode,
          setViewport: setViewport
        })}
      </>
    );
  }

  public provideDependencies({config}): string[] {
    let deps: string[] = [];
    deps.push('openpyxl');
    return deps;
  }

  public provideImports({ config }): string[] {
    return ["import pandas as pd"];
  }

  public generateComponentCode({config, inputName}): string {
    let excelWriterNeeded = config.excelOptions.mode === 'a';
    let options = {...config.excelOptions};
  
    // Remove mode from options as it's handled separately
    delete options.mode;
    
    // Construct options string, adding sheet if specified
    let optionsString = Object.entries(options)
      .filter(([key, value]) => value !== null && value !== '')
      .map(([key, value]) => `${key}='${value}'`)
      .join(', ');
  
    optionsString = optionsString ? `, ${optionsString}` : '';
  
    let code = '';
    if (excelWriterNeeded) {
      code = `with pd.ExcelWriter('${config.filePath}', mode='a') as writer:\n` +
             `    ${inputName}.to_excel(writer, index=False${optionsString})
  `;
    } else {
      code = `${inputName}.to_excel('${config.filePath}', index=False${optionsString})
  `;
    }
    return code;
  }
}
