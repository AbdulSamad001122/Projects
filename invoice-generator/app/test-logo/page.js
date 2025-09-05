"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { convertImageToBase64 } from '@/app/utils/imageToBase64';

export default function TestLogoPage() {
  const [logoUrl, setLogoUrl] = useState('https://res.cloudinary.com/dubngcmbl/image/upload/v1757068635/Invoice-generator/xj2fucssu1ziwpase2og.webp');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testConversion = async () => {
    setLoading(true);
    setResult('');
    setLogs([]);
    
    addLog('🔄 Starting logo conversion test...');
    addLog(`📋 Testing URL: ${logoUrl}`);
    
    try {
      const convertedLogo = await convertImageToBase64(logoUrl);
      
      if (convertedLogo) {
        if (convertedLogo.startsWith('data:')) {
          addLog('✅ Conversion successful! Got base64 data URL');
          addLog(`📏 Data URL length: ${convertedLogo.length} characters`);
          setResult(convertedLogo);
        } else {
          addLog('⚠️ Conversion returned original URL (fallback)');
          setResult(convertedLogo);
        }
      } else {
        addLog('❌ Conversion returned null');
        setResult('null');
      }
    } catch (error) {
      addLog(`❌ Error during conversion: ${error.message}`);
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Logo Conversion Test</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Logo URL:</label>
          <Input
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="Enter Cloudinary logo URL"
            className="w-full"
          />
        </div>
        
        <Button 
          onClick={testConversion} 
          disabled={loading || !logoUrl}
          className="w-full"
        >
          {loading ? 'Testing...' : 'Test Logo Conversion'}
        </Button>
        
        {/* Original Image */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Original Image:</h3>
          <img 
            src={logoUrl} 
            alt="Original logo" 
            className="max-w-xs border border-red-500"
            onLoad={() => addLog('✅ Original image loaded successfully')}
            onError={() => addLog('❌ Original image failed to load')}
          />
        </div>
        
        {/* Converted Image */}
        {result && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Converted Result:</h3>
            {result.startsWith('data:') ? (
              <img 
                src={result} 
                alt="Converted logo" 
                className="max-w-xs border border-blue-500"
                onLoad={() => addLog('✅ Converted image displayed successfully')}
                onError={() => addLog('❌ Converted image failed to display')}
              />
            ) : (
              <div className="p-4 bg-gray-100 rounded">
                <p className="text-sm font-mono break-all">{result}</p>
              </div>
            )}
          </div>
        )}
        
        {/* Logs */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Conversion Logs:</h3>
          <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-64 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}