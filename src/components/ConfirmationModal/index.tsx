import React from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@nextui-org/react';
import { ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: 'confirm' | 'success' | 'error' | 'info';
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'confirm',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDestructive = false
}: ConfirmationModalProps) {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-8 h-8 text-green-500" />;
      case 'error':
        return <XCircleIcon className="w-8 h-8 text-red-500" />;
      case 'info':
        return <InformationCircleIcon className="w-8 h-8 text-blue-500" />;
      default:
        return <ExclamationTriangleIcon className="w-8 h-8 text-orange-500" />;
    }
  };

  const getConfirmButtonColor = () => {
    if (isDestructive) return 'danger';
    switch (type) {
      case 'success':
        return 'success';
      case 'error':
        return 'danger';
      case 'info':
        return 'primary';
      default:
        return 'primary';
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} size="md">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex items-center gap-3">
              {getIcon()}
              <span className="text-lg font-semibold">{title}</span>
            </ModalHeader>
            <ModalBody>
              <p className="text-gray-600 leading-relaxed">{message}</p>
            </ModalBody>
            <ModalFooter>
              <Button
                color="default"
                variant="light"
                onPress={onClose}
                className="font-medium"
              >
                {cancelText}
              </Button>
              <Button
                color={getConfirmButtonColor()}
                onPress={handleConfirm}
                className="font-medium"
              >
                {confirmText}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
} 