const cloudinary = require("./cloudinary");

module.exports.updateUserDocs = async function (newDocs, oldDocs) {

    const newDocsObject = []
    //     const newDocsObject2 = []

    // for (const docs of newDocs) {
    //     console.log(docs.Cloud_ID)
    //     newDocsObject.push(docs)
    // }
    // for (const docs of oldDocs) {
    //     console.log(docs.document_cloud_id)
    //     newDocsObject2.push(docs)

    //}

    // if (newDocs.length) {

    //     async function uploadDocs() {

    //       for (const docs of newDocs) {

    //         await cloudinary.uploader
    //           .upload(docs.Attachment, {
    //             resource_type: "auto"
    //           })
    //           .then((result) => {
    //             const tempDocsObject = {
    //               document_name: docs.Document_Name,
    //               document_no: docs.Document_No,
    //               issue_date: docs.Issue_Date,
    //               expiry_date: docs.Expiry_Date,
    //               document_format: result.format,
    //               document_url: result.url,
    //               document_cloud_id: result.public_id,
    //             }
    //             newDocsObject.push(tempDocsObject)

    //           })
    //           .catch((error) => {
    //             console.log("Error", JSON.stringify(error, null, 2))

    //           })
    //       }

    //     }

    //     await uploadDocs()
    //   }


    if (newDocs.length) {
        //-------------------------------------------------- user has docs to be added or updated
        console.log('user has docs to be added or updated')

        async function uploadDocs() {

            for (const docs of newDocs) {

                if (docs.Attachment) {

                    //-------------------------------------------------- docs is new or replace
                    console.log('docs is new or replace')

                    console.log(docs.Cloud_ID)

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

                    //-------------------------------------------------- docs is the same details and file 
                    console.log('docs is the same details and file')

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
            //-------------------------------------------------- user has no docs but has old docs to be deleted
            console.log('user has no docs but has old docs to be deleted')

            async function deleteDocs() {
                for (const docs of oldDocs) {
                    await cloudinary.uploader.destroy(docs.document_cloud_id);
                    console.log('all docs are deleted' + docs.document_cloud_id)

                }
            }
            await deleteDocs()
        }
    }


    if (newDocsObject.length < oldDocs.length) {
        //-------------------------------------------------- user has docs but less than from ol docs and to be deleted
        console.log('user has docs but less than from ol docs and to be deleted')

        // const docsToDelete = []
        console.log(newDocsObject)
        console.log(oldDocs)


        newDocsObject.forEach((data) => {
            oldDocs.forEach(async (data2) => {
                if (data2.document_cloud_id !== data.document_cloud_id) {
                    await cloudinary.uploader.destroy(data2.document_cloud_id);
                    console.log('Deleted '+ data2.document_cloud_id)
                }
            })
        })

        // console.log('TO BE DELETED' + docsToDelete)
        // async function deleteDocs() {
        //     for (const docs of docsToDelete) {
        //         await cloudinary.uploader.destroy(docs.document_cloud_id);
        //         console.log('docs deleted from old or replace ' + docs.document_cloud_id)

        //     }
        // }
        // await deleteDocs()
    }

    // console.log(newDocsObject)
    return newDocsObject
}

