"use client";

import React from 'react';
import { useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Button } from './ui/button';

export function MLSDebugTest() {
  const TestFunction = () => {
    console.log('Testing MLS API availability...');
    console.log('api object:', api);
    console.log('api.mlsCompliance:', api.mlsCompliance);
    
    try {
      const batchValidate = useAction(api.mlsCompliance.batchValidateCompliance);
      console.log('batchValidateCompliance function:', batchValidate);
    } catch (error) {
      console.error('Error accessing batchValidateCompliance:', error);
    }
    
    try {
      const createExport = useAction(api.mlsCompliance.createMLSExport);
      console.log('createMLSExport function:', createExport);
    } catch (error) {
      console.error('Error accessing createMLSExport:', error);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold mb-2">MLS API Debug Test</h3>
      <Button onClick={TestFunction}>Test API Access</Button>
    </div>
  );
}