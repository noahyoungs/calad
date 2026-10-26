"use client";

import React, { useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Checkbox,
  Input,
  Textarea,
} from "@heroui/react";
import { Icon } from "@iconify-icon/react";

export type ColumnDefinition<T> = {
  key: keyof T;
  label: string;
  renderCell?: (item: T) => React.ReactNode;
  editable?: boolean;
  required?: boolean;
  inputType?: "text" | "textarea" | "select";
  selectOptions?: { value: string; label: string }[];
};

export type DataTableProps<T> = {
  title: string;
  description?: string;
  items: T[];
  columns: ColumnDefinition<T>[];
  onAddItem?: (item: T) => void;
  onDeleteItem?: (item: T) => void;
  onUpdateItem?: (oldItem: T, newItem: T) => void;
  onSelectionChange?: (selectedKeys: Set<string | number>) => void;
  selectedKeys?: Set<string | number>;
  itemKey: keyof T;
  selectionEnabled?: boolean;
  addEnabled?: boolean;
  actionsEnabled?: boolean;
  addButtonText?: string;
  modalTitle?: string;
  editModalTitle?: string;
  bottomContent?: React.ReactNode;
  renderActions?: (item: T) => React.ReactNode;
};

export function DataTable<T extends Record<string, any>>({
  title,
  description,
  items,
  columns,
  onAddItem,
  onDeleteItem,
  onUpdateItem,
  onSelectionChange,
  selectedKeys,
  itemKey,
  selectionEnabled = false,
  addEnabled = true,
  actionsEnabled = true,
  addButtonText = "Add Item",
  modalTitle = "Add New Item",
  editModalTitle = "Edit Item",
  bottomContent,
  renderActions,
}: DataTableProps<T>) {
  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const [internalSelectedKeys, setInternalSelectedKeys] = useState<Set<string | number>>(new Set());
  const [newItem, setNewItem] = useState<Partial<T>>({});
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [editedItem, setEditedItem] = useState<Partial<T>>({});

  // Use either controlled (from props) or uncontrolled (internal state) selection
  const currentSelectedKeys = selectedKeys || internalSelectedKeys;

  const handleSelectionChange = (keys: Set<string | number>) => {
    // If not controlled, update internal state
    if (!selectedKeys) {
      setInternalSelectedKeys(keys);
    }
    
    // Always call the callback
    if (onSelectionChange) {
      onSelectionChange(keys);
    }
  };

  const handleAddItem = () => {
    if (onAddItem && Object.keys(newItem).length > 0) {
      onAddItem(newItem as T);
      setNewItem({});
      onAddClose();
    }
  };

  const handleEditItem = (item: T) => {
    setEditingItem(item);
    setEditedItem({...item});
    onEditOpen();
  };

  const handleSaveEdit = () => {
    if (onUpdateItem && editingItem) {
      const updatedItem = { ...editingItem, ...editedItem };
      onUpdateItem(editingItem, updatedItem as T);
      setEditingItem(null);
      setEditedItem({});
      onEditClose();
    }
  };

  const handleDeleteItem = (item: T) => {
    if (onDeleteItem) {
      onDeleteItem(item);
    }
  };

  const handleInputChange = (key: keyof T, value: any) => {
    setNewItem((prev) => ({ ...prev, [key]: value }));
  };

  const handleEditInputChange = (key: keyof T, value: any) => {
    setEditedItem((prev) => ({ ...prev, [key]: value }));
  };

  // Create header columns array to avoid using conditional rendering with null
  const headerColumns = [...columns.map(column => (
    <TableColumn key={String(column.key)}>{column.label}</TableColumn>
  ))];
  
  // Add actions column only if actions are enabled
  if (actionsEnabled) {
    headerColumns.push(
      <TableColumn key="actions" className="text-left">Actions</TableColumn>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col gap-2 mb-4">
        <h3 className="text-base font-medium text-default-700">{title}</h3>
        {description && <p className="text-sm font-normal text-default-400">{description}</p>}
      </div>

      <Table
        aria-label={title}
        selectionMode={selectionEnabled ? "multiple" : "none"}
        selectedKeys={currentSelectedKeys}
        onSelectionChange={handleSelectionChange as any}
        bottomContent={bottomContent || (addEnabled && (
              <Button 
                color="primary" 
                startContent={<Icon icon="tabler:plus" width="18" height="18" />} 
                variant="flat"
                onPress={onAddOpen}
              >
                {addButtonText}
              </Button>
          ))}
      >
        <TableHeader>
          {headerColumns}
        </TableHeader>
        <TableBody emptyContent={"No items to display"}>
          {items.map((item) => {
            // Create row cells array to avoid using conditional rendering with null
            const rowCells = [...columns.map(column => (
              <TableCell key={`${String(item[itemKey])}-${String(column.key)}`}>
                {column.renderCell ? column.renderCell(item) : String(item[column.key] || '')}
              </TableCell>
            ))];
            
            // Add actions cell only if actions are enabled
            if (actionsEnabled) {
              rowCells.push(
                <TableCell key={`${String(item[itemKey])}-actions`}>
                  {renderActions ? (
                    renderActions(item)
                  ) : (
                    <div className="flex justify-start">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="primary"
                        onPress={() => handleEditItem(item)}
                      >
                        <Icon icon="tabler:edit" width="18" height="18" />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        onPress={() => handleDeleteItem(item)}
                      >
                        <Icon icon="tabler:trash" width="18" height="18" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              );
            }
            
            return (
              <TableRow key={String(item[itemKey])}>
                {rowCells}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

     

      {/* Add Item Modal */}
      {addEnabled && (
        <Modal isOpen={isAddOpen} onClose={onAddClose}>
          <ModalContent>
            <ModalHeader>{modalTitle}</ModalHeader>
            <ModalBody>
              {columns
                .filter((column) => column.editable !== false)
                .map((column) => (
                  <div key={String(column.key)} className="mb-4">
                    <p className="text-sm mb-1">
                      {column.label}
                      {column.required && <span className="text-danger"> *</span>}
                    </p>
                    {column.inputType === "textarea" ? (
                      <Textarea
                        placeholder={`Enter ${column.label.toLowerCase()}`}
                        value={(newItem[column.key] as string) || ""}
                        onChange={(e) => handleInputChange(column.key, e.target.value)}
                        color="primary"
                        variant="bordered"
                        isRequired={column.required}
                      />
                    ) : column.inputType === "select" && column.selectOptions ? (
                      <select
                        className="w-full p-2 rounded border border-default-200"
                        value={(newItem[column.key] as string) || ""}
                        onChange={(e) => handleInputChange(column.key, e.target.value)}
                        required={column.required}
                      >
                        <option value="">Select {column.label}</option>
                        {column.selectOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        placeholder={`Enter ${column.label.toLowerCase()}`}
                        value={(newItem[column.key] as string) || ""}
                        onChange={(e) => handleInputChange(column.key, e.target.value)}
                        color="primary"
                        variant="bordered"
                        isRequired={column.required}
                      />
                    )}
                  </div>
                ))}
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onAddClose}>
                Cancel
              </Button>
              <Button color="primary" onPress={handleAddItem}>
                Add
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Edit Item Modal */}
      {actionsEnabled && (
        <Modal isOpen={isEditOpen} onClose={onEditClose}>
          <ModalContent>
            <ModalHeader>{editModalTitle}</ModalHeader>
            <ModalBody>
              {columns
                .filter((column) => column.editable !== false)
                .map((column) => (
                  <div key={String(column.key)} className="mb-4">
                    <p className="text-sm mb-1">
                      {column.label}
                      {column.required && <span className="text-danger"> *</span>}
                    </p>
                    {column.inputType === "textarea" ? (
                      <Textarea
                        placeholder={`Enter ${column.label.toLowerCase()}`}
                        value={(editedItem[column.key] as string) || ""}
                        onChange={(e) => handleEditInputChange(column.key, e.target.value)}
                        color="primary"
                        variant="bordered"
                        isRequired={column.required}
                      />
                    ) : column.inputType === "select" && column.selectOptions ? (
                      <select
                        className="w-full p-2 rounded border border-default-200"
                        value={(editedItem[column.key] as string) || ""}
                        onChange={(e) => handleEditInputChange(column.key, e.target.value)}
                        required={column.required}
                      >
                        <option value="">Select {column.label}</option>
                        {column.selectOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        placeholder={`Enter ${column.label.toLowerCase()}`}
                        value={(editedItem[column.key] as string) || ""}
                        onChange={(e) => handleEditInputChange(column.key, e.target.value)}
                        color="primary"
                        variant="bordered"
                        isRequired={column.required}
                      />
                    )}
                  </div>
                ))}
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onEditClose}>
                Cancel
              </Button>
              <Button color="primary" onPress={handleSaveEdit}>
                Save
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
} 