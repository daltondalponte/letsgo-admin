import React from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalProps,
} from "@nextui-org/react";
import "./drawer.css";

interface DrawerProps extends Omit<ModalProps, "className" | "fullScreen" | "closeButton" | "animated" | "blur"> {
  children: React.ReactNode;
}

const Drawer: React.FC<DrawerProps> = ({ children, isOpen, onOpenChange, ...props }) => {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="center"
      hideCloseButton
      size="full"
      backdrop="opaque"
      classNames={{
        wrapper: "flex justify-end",
      }}
      motionProps={{
        variants: {
          enter: {
            x: 0,
            opacity: 1,
            transition: {
              duration: 0.3,
              ease: "easeOut",
            },
          },
          exit: {
            x: 50,
            opacity: 0,
            transition: {
              duration: 0.2,
              ease: "easeIn",
            },
          },
        },
      }}
      className="rounded-md max-w-lg w-full h-screen max-h-screen drawer bg-content1"
      {...props}
    >
      <ModalContent>{(onClose) => <>{children}</>}</ModalContent>
    </Modal>
  );
};

export const DrawerHeader = ModalHeader;
export const DrawerBody = ModalBody;
export const DrawerFooter = ModalFooter;
export default Drawer; 