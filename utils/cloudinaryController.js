const cloudinary = require("./cloudinary");

module.exports.addUserDocs =  async function(docs){

    const docsObject = []

  if (docs.length) {

    async function uploadDocs() {

      for (const obj of docs) {

        await cloudinary.uploader
          .upload(obj.Attachment, {
            resource_type: "auto"
          })
          .then((result) => {
            const tempDocsObject = {
              document_name: obj.Document_Name,
              document_no: obj.Document_No,
              issue_date: obj.Issue_Date,
              expiry_date: obj.Expiry_Date,
              document_format: result.format,
              document_url: result.url,
              document_cloud_id: result.public_id,
            }
            docsObject.push(tempDocsObject)

          })
          .catch((error) => {
            console.log("Error", JSON.stringify(error, null, 2))

          })
      }

    }

    await uploadDocs()
  }

  return docsObject

}

module.exports.updateUserDocs = async function (newDocs, oldDocs) {

    const newDocsObject = []

    if (newDocs.length) {

        async function uploadDocs() {

            for (const docs of newDocs) {

                if (docs.Attachment) {

                    await cloudinary.uploader
                        .upload(docs.Attachment, {
                            resource_type: "auto"
                        })
                        .then(async (result) => {
                            const tempDocsObject = {
                                document_name: docs.Document_Name,
                                document_no: docs.Document_No,
                                issue_date: docs.Issue_Date,
                                expiry_date: docs.Expiry_Date,
                                document_format: result.format,
                                document_url: result.url,
                                document_cloud_id: result.public_id,
                            }
                            newDocsObject.push(tempDocsObject)

                            docs.Cloud_ID && await cloudinary.uploader.destroy(docs.Cloud_ID);
                        })
                        .catch((error) => {
                            console.log("Error", JSON.stringify(error, null, 2))

                        })

                } else {

                    const tempDocsObject = {
                        document_name: docs.Document_Name,
                        document_no: docs.Document_No,
                        issue_date: docs.Issue_Date,
                        expiry_date: docs.Expiry_Date,
                        document_format: docs.Cloud_Format,
                        document_url: docs.Cloud_URL,
                        document_cloud_id: docs.Cloud_ID,
                    }
                    newDocsObject.push(tempDocsObject)
                }
            }
        }
        await uploadDocs()

    } else {


        if (oldDocs.length) {

            async function deleteDocs() {
                for (const docs of oldDocs) {
                    await cloudinary.uploader.destroy(docs.document_cloud_id);

                }
            }
            await deleteDocs()
        }
    }

    
    if (newDocsObject.length && oldDocs.length) {
        newDocsObject.forEach((data) => {
            oldDocs.forEach(async (oldData, idx) => {
                if (data.document_cloud_id === oldData.document_cloud_id) {
                    oldDocs.splice(idx, 1)
                }
            })
        })

        oldDocs.forEach(async (data) => {
            await cloudinary.uploader.destroy(data.document_cloud_id);
        })
    }

    return newDocsObject
}

