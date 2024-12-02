import React from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolderPlus, faCameraAlt } from '@fortawesome/free-solid-svg-icons';
const FileUpload: React.FC = () => {

    return (
        <div className="chat-file">
            <button><FontAwesomeIcon icon={faFolderPlus} style={{ fontSize: "24px" }} /></button>
            <button><FontAwesomeIcon icon={faCameraAlt} style={{ fontSize: "24px" }} /></button>
        </div>
    )
}
export default FileUpload