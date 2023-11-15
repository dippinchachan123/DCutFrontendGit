import "../../Cart/dataTable/datatable.scss";
import { DataGrid } from "@mui/x-data-grid";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import notificationPopup from "../../../helpers/notifications";
import { Cart } from "../../../apis/api.cart";
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReturnForm from "../../Forms/returnWeight";
import { returnWeights } from "../../../enums/processes";
import { errors, success } from "../../../enums/messages";
import IssueForm from "../../Forms/issuePacketForm";
import IssuedPacketForm from "../../Forms/issuePacketOpen";
import SubReturnForm from "../../Forms/returnWeightSubPacket";


const Datatable = ({ ids }) => {
  const [data, setData] = useState([]);
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());
  const [kapanId, cutId, process, packetId] = ids.split("-").map(ele => {
    if (!isNaN(ele)) {
      return parseInt(ele)
    } return ele
  })

  const [RTFormVisibility, setRTFormVisibility] = useState(false);
  const [rowDetails, setRowDetails] = useState(null);
  const [IssueFormVisibility, setIssueFormVisibility] = useState(false);
  const [IssuedPacketVisibility, setIssuedPacketVisibility] = useState(false);

  const selectedEntries = (ids) => {
    const res = Array.from(ids).length != 0 && Array.from(ids).map((rowId) => data.find((row) => row.id === rowId));
    return res
  }

  const navigate = useNavigate();

  const toggleISForm = (e) => {
    setIssueFormVisibility(!IssueFormVisibility)
  }
  const toggleIssuedPacketForm = (e) => {
    setIssuedPacketVisibility(!IssuedPacketVisibility)
  }

  const handleDelete = (id) => {
    Cart.deleteSPacket(kapanId, cutId, process, packetId, id)
      .then(res => {
        if (res.err) {
          notificationPopup(res.msg, "error")
        }
        else {
          notificationPopup(res.msg, "success")
          setData(data.filter((item) => item.id !== id));
        }
      })
      .catch(err => {
        notificationPopup(errors.DELETION_ERROR, "error")
      })
  };

  const handleSubmitIssueForm = (e, packets, dlt = false) => {
    packets.packets.length && packets.packets.forEach(packet => {
      Cart.editSPacketField(kapanId, cutId, process, packetId, packet.id, "issue", { issue: packets.user })
        .then(res => {
          if (res.err) {
            // notificationPopup(errors.UPDATE_ERROR,"error")
            console.log("Error", res.err)
          }
          else {
            toggleISForm();
            setSelectedRowIds(new Set())
          }
        })
      toggleISForm()
    })
  }

  const handleUnSubmitIssueForm = (e, id) => {
    Cart.editSPacketField(kapanId, cutId, process, packetId, id, "issue", { issue: null })
      .then(res => {
        if (res.err) {
          // notificationPopup(errors.UPDATE_ERROR,"error")
          console.log("Error", res.err)
          notificationPopup(errors.UPDATE_ERROR, "error")
        }
        else {
          toggleIssuedPacketForm()
          notificationPopup(success.UPDATE_SUCCESS, "success")

          setSelectedRowIds(new Set())
        }
      })
  }

  const getTableData = (data) => {
    // Create a deep copy of the data array to avoid modifying the original array4
    return data;
  };

  const handleEdit = (id) => {
    navigate(`/Packet/Edit/${ids}-${id}`)
  }

  const toggleRTForm = (e,issue,isReturn) => {
    isReturn || issue || RTFormVisibility?setRTFormVisibility(!RTFormVisibility):notificationPopup("Issue Packet First!!","error")
  }

  const handleSubmitRTForm = (e, formData, id, dlt = false) => {
    Cart.editSPacketField(kapanId, cutId, process, packetId,id, "return", { return: dlt?null:formData })
      .then(res => {
        if (res.err) {
          console.log("Error", res.err)
          toggleRTForm()
        }
        else {
          Cart.editSPacketField(kapanId, cutId, process, packetId,id, "loss", { loss: (!dlt) ? rowDetails.weight - formData.weight : 0 })
            .then(res => {
              if (res.err) {
                notificationPopup("Update Successfull!!(Return Weight not changed.)", "success")
              }
              else {
                toggleRTForm();
                notificationPopup(success.UPDATE_SUCCESS, "success")
              }
            })
            .catch(err => {
              toggleRTForm()
              notificationPopup(errors.UPDATE_ERROR, "error")
            })
        }
      })
  }

  useEffect(() => {
    Cart.getSPackets(kapanId, cutId, process, packetId)
      .then(res => {
        if (!res.err) {
          setData(res.data[0].subPackets)
        }
        else {
          notificationPopup(res.msg, "error")
        }
      })
      .catch(err => {
        notificationPopup(err, "error")
      })
  }, [ids, IssueFormVisibility, IssuedPacketVisibility,RTFormVisibility])

  const userColumns = [
    { field: "id", headerName: "P No.", width: 70 },
    {
      field: "status",
      headerName: "Status",
      width: 100,
      renderCell: (params) => {
        return (
          <div className={`cellWithStatus ${params.row.status}`}>
            {params.row.status}
          </div>
        );
      },
    },
    {
      field: "MMValue",
      headerName: "MM Value",
      width: 100

    },
    {
      field: "pieces",
      headerName: "Pieces",
      width: 100

    },
    {
      field: "weight",
      headerName: "Weight",
      width: 100

    },
    {
      field: "size",
      headerName: "Size",
      width: 100
    },
    {
      field: "returnPieces",
      headerName: "RPcs",
      width: 100,
      renderCell : (params) => {
        return params.row.return?.pieces;
      }
    },
    {
      field: "returnWeight",
      headerName: "RWgt",
      width: 100,
      renderCell : (params) => {
        return params.row.return?.weight;
      }

    },
    {
      field: "loss",
      headerName: "Loss",
      width: 160,
      renderCell: (params) => {
        return (
          <div >
            {`${params.row.loss || 0} (${((params.row.loss || 0) / (params.row.weight) * 100).toFixed(2)}%)`}
          </div>
        );
      },
    },
    {
      field: "return",
      headerName: "Return",
      width: 100,
      renderCell: (params) => {
        if (!params.row.return) {
          return (
            <button className='return cancel' onClick={(e) => toggleRTForm(e,params.row.issue,params.row.return)}>
              <CancelIcon />
            </button>

          )
        }
        else {
          return (
            <button className='return check' onClick={(e) => toggleRTForm(e,params.row.issue,params.row.return)}>
              <CheckCircleIcon />
            </button>)
        }
      }
    },
  ];

  const actionColumn = [
    {
      field: "issued",
      headerName: "Issued To",
      width: 400,
      renderCell: (params) => {
        if (!params.row.issue) {
          return (
            <button className='return cancel' onClick={(e) => toggleIssuedPacketForm(e)}>
              <div style={{ padding: '5px' }} ><CancelIcon /></div>
            </button>
          )
        }
        else {
          console.log("Issued row : ", params.row.issue)
          return (<button className='return check' onClick={(e) => toggleIssuedPacketForm(e)}>
            {<div style={{ display: "flex", flexDirection: "row", padding: '5px', columnGap: '5px', alignItems: 'centre' }}><CheckCircleIcon />
              <h3 style={{ alignSelf: 'center' }}>{params.row.issue?.split("-")[1]}</h3></div>}
          </button>)
        }
      }
    },
    {
      field: "action",
      headerName: "Action",
      width: 200,
      renderCell: (params) => {
        return (
          <div className="cellAction">
            <div
              className="editButton"
              onClick={() => handleEdit(params.row.id)}
            >
              Edit
            </div>

            <div
              className="deleteButton"
              onClick={() => handleDelete(params.row.id)}
            >
              Delete
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <div className="datatable">
      <div className="datatableTitle">
        Sub Packets
        <div>
          <button onClick={(e) => toggleISForm()} className="link" style={{ marginRight: '20px' }}>
            Issue Packets
          </button>
          <button onClick={() => navigate(`/Packet/New/${ids}`)} className="link" style={{ alignSelf: 'right' }}>
            Add New
          </button>

        </div>
      </div>

      {IssueFormVisibility &&
        <IssueForm headerDetails={{ kapanId: kapanId, cutId: cutId }} PacketsData={selectedEntries(selectedRowIds)} onClose={toggleISForm} onSubmit={handleSubmitIssueForm} postProcess={false}/>}

      {IssuedPacketVisibility && rowDetails.issue &&
        <IssuedPacketForm headerDetails={{ kapanId: kapanId, cutId: cutId, id: rowDetails.id }} StaffData={rowDetails.issue} onClose={toggleIssuedPacketForm} onSubmit={handleUnSubmitIssueForm} />}

      {RTFormVisibility && <SubReturnForm headerDetails={{ weight: rowDetails.weight, packetID: rowDetails.packetId, pieces: rowDetails.pieces ,id : rowDetails.id}}
        weights={rowDetails.return} onClose={toggleRTForm} onSubmission={handleSubmitRTForm} />}

      <DataGrid
        className="datagrid"
        rows={getTableData(data)}
        columns={userColumns.concat(actionColumn)}
        pageSize={9}
        rowsPerPageOptions={[9]}
        disableSelectionOnClick={true}
        checkboxSelection
        onRowClick={(params) => {
          console.log(params.row)
          setRowDetails(params.row)
        }}
        getRowId={(row) => row.id}
        selectionModel={Array.from(selectedRowIds)}
        onSelectionModelChange={(newSelection) => {
          setSelectedRowIds(new Set(newSelection));
        }}
      />
    </div>
  );
};

export default Datatable;