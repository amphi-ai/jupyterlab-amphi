import React, { useCallback, useEffect } from 'react';
import { Handle, Position, useReactFlow, useStore, useStoreApi } from 'reactflow';

import { ComponentItem, PipelineComponent, generateUIFormComponent, onChange, renderComponentUI, renderHandle, setDefaultConfig } from '@amphi/pipeline-components-manager';
import { mySQLIcon } from '../icons';

export class MySQLInput extends PipelineComponent<ComponentItem>() {
  public _name = "MySQL Input";
  public _id = "mySQLInput";
  public _type = "pandas_df_input";
  public _category = "input";
  public _icon = mySQLIcon; // Adjust if there's a different icon for databases
    public _default = { dbOptions: { host: "localhost", port: "3306", databaseName: "", username: "", password: "", tableName: ""} };
    public _form = {
      fields: [
        {
          type: "input",
          label: "Host",
          id: "dbOptions.host",
          placeholder: "Enter database host",
          advanced: true
        },
        {
          type: "input",
          label: "Port",
          id: "dbOptions.port",
          placeholder: "Enter database port",
          advanced: true
        },
        {
          type: "input",
          label: "Database Name",
          id: "dbOptions.databaseName",
          placeholder: "Enter database name",
        },
        {
          type: "input",
          label: "Username",
          id: "dbOptions.username",
          placeholder: "Enter username",
          advanced: true
        },
        {
          type: "input",
          label: "Password",
          id: "dbOptions.password",
          placeholder: "Enter password",
          inputType: "password",
          advanced: true
        },
        {
          type: "input",
          label: "Table Name",
          id: "dbOptions.tableName",
          placeholder: "Enter table name",
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
        const defaultConfig = this.Default; 
    
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
  
    public UIComponent({ id, data, context, manager, commands  }) {
  
      const { setNodes, deleteElements, setViewport } = useReactFlow();
      const store = useStoreApi();
  
      const deleteNode = useCallback(() => {
        deleteElements({ nodes: [{ id }] });
      }, [id, deleteElements]);
  
      const zoomSelector = (s) => s.transform[2] >= 1;
      const showContent = useStore(zoomSelector);
      
      const handleElement = React.createElement(renderHandle, {
        type: MySQLInput.Type,
        Handle: Handle,
        Position: Position
      });
      
      return (
        <>
          {renderComponentUI({
            id: id,
            data: data,
            context: context,
            manager: manager,
            commands: commands,
            name: MySQLInput.Name,
            ConfigForm: MySQLInput.ConfigForm({nodeId:id, data, context, manager, commands, store, setNodes}),
            Icon: MySQLInput.Icon,
            showContent: showContent,
            handle: handleElement,
            deleteNode: deleteNode,
            setViewport: setViewport,
          })}
        </>
      );
    }
  
    public provideImports({config}): string[] {
      return ["import pandas as pd", "import sqlalchemy", "import pymysql"];
    }  

    public generateComponentCode({config, outputName}): string {
      let connectionString = `mysql+pymysql://${config.dbOptions.username}:${config.dbOptions.password}@${config.dbOptions.host}:${config.dbOptions.port}/${config.dbOptions.databaseName}`;
      const uniqueEngineName = `${outputName}_Engine`; // Unique engine name based on the outputName
      const code = `
# Connect to the MySQL database
${uniqueEngineName} = sqlalchemy.create_engine('${connectionString}')
${outputName} = pd.read_sql_table('${config.dbOptions.tableName}', ${uniqueEngineName}).convert_dtypes()
`;
      return code;
    }
  }
