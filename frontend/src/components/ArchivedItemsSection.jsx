import React from 'react';
import ConsumptionItemsSection from './ConsumptionItemsSection';

export default function ArchivedItemsSection(props) {
  // Always force showArchived to true
  return <ConsumptionItemsSection {...props} forceArchivedView={true} />;
}
