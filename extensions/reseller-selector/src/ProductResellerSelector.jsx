import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Select,
  Text,
  InlineLayout,
  Banner,
  Spinner,
  BlockStack,
  Divider,
} from '@shopify/polaris';

export default function ProductResellerSelector({ productId }) {
  const [resellers, setResellers] = useState([]);
  const [selectedResellers, setSelectedResellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (productId) {
      loadResellers();
      loadProductResellers();
    }
  }, [productId]);

  const loadResellers = async () => {
    try {
      // Use the app's API URL - you'll need to configure this
      const apiUrl = window.location.origin; // or your deployed app URL
      const response = await fetch(`${apiUrl}/api/resellers`);
      const data = await response.json();
      setResellers(data);
    } catch (error) {
      console.error('Error loading resellers:', error);
      setMessage('Error loading resellers');
    }
  };

  const loadProductResellers = async () => {
    try {
      const apiUrl = window.location.origin;
      const response = await fetch(`${apiUrl}/api/products/${productId}/resellers`);
      const data = await response.json();
      setSelectedResellers(data.map(r => r.id.toString()));
    } catch (error) {
      console.error('Error loading product resellers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      const apiUrl = window.location.origin;
      const response = await fetch(`${apiUrl}/api/products/${productId}/resellers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          resellerIds: selectedResellers.map(id => parseInt(id)) 
        }),
      });

      if (response.ok) {
        setMessage('Resellers updated successfully!');
      } else {
        setMessage('Error updating resellers');
      }
    } catch (error) {
      console.error('Error saving resellers:', error);
      setMessage('Error saving resellers');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAll = () => {
    setSelectedResellers(resellers.map(r => r.id.toString()));
  };

  const handleClearAll = () => {
    setSelectedResellers([]);
  };

  if (loading) {
    return (
      <Card sectioned>
        <InlineLayout align="center">
          <Spinner size="small" />
          <Text>Loading resellers...</Text>
        </InlineLayout>
      </Card>
    );
  }

  return (
    <Card sectioned>
      <BlockStack gap="4">
        <Text variant="headingMd">Reseller Management</Text>
        <Text>Select which resellers carry this product:</Text>
        
        <Select
          label="Resellers"
          options={[
            { label: 'Select resellers...', value: '' },
            ...resellers.map(reseller => ({
              label: reseller.name,
              value: reseller.id.toString(),
            }))
          ]}
          value={selectedResellers}
          onChange={setSelectedResellers}
          multiSelect
        />
        
        <InlineLayout gap="2">
          <Button onClick={handleSelectAll} size="slim">
            Select All
          </Button>
          <Button onClick={handleClearAll} size="slim">
            Clear All
          </Button>
        </InlineLayout>
        
        <Divider />
        
        <InlineLayout align="space-between">
          <Text>
            {selectedResellers.length} reseller(s) selected
          </Text>
          <Button 
            primary 
            onClick={handleSave}
            loading={saving}
          >
            Save Resellers
          </Button>
        </InlineLayout>
        
        {message && (
          <Banner status={message.includes('Error') ? 'critical' : 'success'}>
            {message}
          </Banner>
        )}
        
        {selectedResellers.length > 0 && (
          <Card sectioned>
            <BlockStack gap="2">
              <Text variant="headingSm">Selected Resellers:</Text>
              {selectedResellers.map(id => {
                const reseller = resellers.find(r => r.id.toString() === id);
                return reseller ? (
                  <Text key={id}>• {reseller.name}</Text>
                ) : null;
              })}
            </BlockStack>
          </Card>
        )}
      </BlockStack>
    </Card>
  );
}
