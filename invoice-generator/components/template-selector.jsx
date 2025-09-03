"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Eye, Palette, FileText, Download, Zap, X } from "lucide-react";
import { getAvailableTemplates, getDefaultTemplate, setDefaultTemplate } from "@/app/utils/templates";
import Image from "next/image";

const TemplateSelector = ({
  selectedTemplate,
  onTemplateChange,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultTemplate, setDefaultTemplateState] = useState(getDefaultTemplate());
  const templates = getAvailableTemplates();
  const currentTemplate =
    templates.find((t) => t.id === selectedTemplate) ||
    templates.find((t) => t.id === defaultTemplate);

  const handleTemplateSelect = (templateId) => {
    onTemplateChange(templateId);
    setIsOpen(false);
  };

  const handleSetAsDefault = (templateId, e) => {
    e.stopPropagation(); // Prevent template selection
    if (setDefaultTemplate(templateId)) {
      setDefaultTemplateState(templateId);
    }
  };

  const handleImageClick = (e, template) => {
    e.stopPropagation(); // Prevent template selection
    const imageSrc = `/${template.id === 'blue-modern' ? 'blue-theme.jpg' : template.id === 'yellow-classic' ? 'yellow-theme.jpg' : template.id === 'green-modern' ? 'green-theme.jpg' : 'default-theme.jpg'}`;
    window.open(imageSrc, '_blank');
  };

  const features = [
    { icon: Palette, text: 'Professional color schemes', color: 'blue' },
    { icon: FileText, text: 'Clean and organized layout', color: 'green' },
    { icon: Download, text: 'PDF export ready', color: 'purple' },
    { icon: Zap, text: 'Fast loading templates', color: 'orange' }
  ];

  const getTemplateColors = (templateId) => {
    switch (templateId) {
      case 'blue-modern':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          button: 'bg-blue-600 hover:bg-blue-700',
          selected: 'border-blue-500 ring-blue-200'
        };
      case 'yellow-classic':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          button: 'bg-yellow-600 hover:bg-yellow-700',
          selected: 'border-yellow-500 ring-yellow-200'
        };
      case 'green-modern':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          button: 'bg-green-600 hover:bg-green-700',
          selected: 'border-green-500 ring-green-200'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          button: 'bg-gray-600 hover:bg-gray-700',
          selected: 'border-gray-500 ring-gray-200'
        };
    }
  };

  const getFeatureColors = (color) => {
    switch (color) {
      case 'blue':
        return 'text-blue-600 bg-blue-100';
      case 'green':
        return 'text-green-600 bg-green-100';
      case 'purple':
        return 'text-purple-600 bg-purple-100';
      case 'orange':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className={className}>
      {/* Trigger Button */}
      <Button 
        type="button"
        variant="outline" 
        className="w-full justify-start gap-2"
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(true);
        }}
      >
        <Palette className="h-4 w-4" />
        <span>Template: {currentTemplate?.name}</span>
        <Badge variant="secondary" className="ml-auto">
          {templates.length} available
        </Badge>
      </Button>

      {/* Custom Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-[98vw] max-w-[1400px] max-h-[95vh] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-8 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
              <div className="text-center flex-1">
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  Choose Invoice Template
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  Select a template for your invoice. All templates use the same data fields and structure.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-6 right-6 h-8 w-8 rounded-full"
                onClick={(e) => {
                  e.preventDefault();
                  setIsOpen(false);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(95vh-140px)] p-8">
              {/* Templates Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-12">
                {templates.map((template) => {
                  const colors = getTemplateColors(template.id);
                  const isSelected = selectedTemplate === template.id;
                  
                  return (
                    <div
                      key={template.id}
                      className={`group relative bg-white dark:bg-gray-800 rounded-2xl border-2 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 cursor-pointer ${
                        isSelected
                          ? `${colors.selected} ring-4 shadow-2xl scale-105`
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      onClick={() => handleTemplateSelect(template.id)}
                    >
                      {/* Header */}
                      <div className="p-8 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                              {template.name}
                            </h3>
                            {template.id === defaultTemplate && (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs font-semibold px-2 py-1 rounded-full border border-green-200 dark:border-green-700">
                                <Check className="w-3 h-3 mr-1" />
                                Default
                              </Badge>
                            )}
                          </div>
                          {isSelected && (
                            <div className="flex items-center justify-center w-8 h-8 bg-blue-500 rounded-full animate-in zoom-in-50 duration-300">
                              <Check className="w-5 h-5 text-white" />
                            </div>
                          )}
                        </div>
                        <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                          {template.description}
                        </p>
                        {template.id !== defaultTemplate && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-xs px-3 py-1 h-7 border-gray-300 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-700"
                            onClick={(e) => handleSetAsDefault(template.id, e)}
                          >
                            Set as Default
                          </Button>
                        )}
                      </div>
                      
                      {/* Image Container */}
                      <div className={`relative h-80 ${colors.bg} dark:bg-gray-700 overflow-hidden`}>
                        <div className="relative w-full h-full p-6">
                          <div 
                            className="relative w-full h-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow duration-300"
                            onClick={(e) => handleImageClick(e, template)}
                            title="Click to view full size image in new tab"
                          >
                            <Image
                              src={`/${template.id === 'blue-modern' ? 'blue-theme.jpg' : template.id === 'yellow-classic' ? 'yellow-theme.jpg' : template.id === 'green-modern' ? 'green-theme.jpg' : 'default-theme.jpg'}`}
                              alt={`${template.name} template preview`}
                              fill
                              className="object-contain p-4 transition-transform duration-700 group-hover:scale-110 pointer-events-none"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              priority={template.id === 'blue-modern'}
                              onError={(e) => {
                                const fallback = e.target.parentElement.nextElementSibling;
                                e.target.style.display = 'none';
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                            
                            {/* Fallback */}
                            <div className="hidden absolute inset-0 items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                              <div className="text-center">
                                <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500 dark:text-gray-400 font-semibold text-lg">Template Preview</p>
                                <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Image not available</p>
                              </div>
                            </div>
                            
                            {/* Hover Overlay with Eye Icon */}
                            <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100 pointer-events-none">
                              <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-full p-6 transform scale-75 hover:scale-100 transition-all duration-300 shadow-lg">
                                <Eye className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg">
                                <Eye className="w-4 h-4 inline mr-2" />
                                Click to view full size
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Selection Indicator */}
                      <div className="p-8">
                        {isSelected ? (
                          <div className="flex items-center justify-center py-4 px-8 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl font-bold text-lg shadow-lg">
                            <Check className="w-6 h-6 mr-3" />
                            Selected Template
                          </div>
                        ) : (
                          <div className="flex items-center justify-center py-4 px-8 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 rounded-2xl font-bold text-lg transition-all duration-300 group-hover:from-blue-500 group-hover:to-blue-600 group-hover:text-white group-hover:shadow-lg">
                            Select Template
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Template Features */}
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 rounded-3xl p-10 border border-blue-200 dark:border-gray-600 shadow-lg">
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                  Template Features
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {features.map((feature, index) => {
                    const IconComponent = feature.icon;
                    const colorClasses = getFeatureColors(feature.color);
                    
                    return (
                      <div key={index} className="flex items-center space-x-6 p-6 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-white/40 dark:border-gray-600/40 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300">
                        <div className="flex-shrink-0">
                          <div className={`p-3 rounded-xl ${colorClasses}`}>
                            <IconComponent className="w-7 h-7" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${colorClasses.replace('text-', 'bg-').replace(' bg-', ' ')} shadow-lg`}></div>
                            <span className="text-gray-800 dark:text-gray-200 font-semibold text-lg">
                              {feature.text}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateSelector;