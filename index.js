const core = require('@actions/core');
const { Octokit } = require("@octokit/action");

try {
    const days = parseInt(core.getInput("days"));
    const maxArtifacts = parseInt(core.getInput("max-artifacts-to-delete"));
    const isDryRun = core.getInput("dry-run").toLowerCase() != "no";
    const perPage = 100;
    const deleteArtifactsPromises = [];

    const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
    const octokit = new Octokit();
    const listArtifactsForRepo = octokit.actions.listArtifactsForRepo.endpoint.merge({
        owner,
        repo,
        page: 1,
        per_page: perPage,
    });

    octokit.request(listArtifactsForRepo).then(response => {
        const totalCount = parseInt(response.data.total_count);
        const lastPage = Math.ceil(totalCount/perPage);
        let lastArtifactCount = totalCount % perPage;
        let pageIndex = 0;
        let artifactToDeleteCount = Math.min(parseInt(totalCount), maxArtifacts);

        console.log(`Total artifacts: ${totalCount}`);
        console.log(`Total artifacts to delete: ${artifactToDeleteCount}`);
        console.log('========================');

        // console.log('============DEBUG1============');
        // console.log(`totalCount: ${totalCount}`);
        // console.log(`lastPage: ${lastPage}`);
        // console.log(`maxArtifacts: ${maxArtifacts}`);
        // console.log(`artifactToDeleteCount: ${artifactToDeleteCount}`);
        // console.log(`perPage: ${perPage}`);
        // console.log('============ENDDEBUG============');

        let artifactDeletedCount = 0;

        async function deleteArtifacts() {
            while (artifactToDeleteCount > 0 && lastPage - pageIndex > 0) {
                // console.log('============DEBUG2============');
                // console.log(`artifactToDeleteCount: ${artifactToDeleteCount}`);
                // console.log(`lastPage: ${lastPage}`);
                // console.log(`pageIndex: ${pageIndex}`);
                // console.log(`lastPage - pageIndex: ${lastPage - pageIndex}`);
                // console.log('============ENDDEBUG============');
                const listArtifactsForRepoToRemove = octokit.actions.listArtifactsForRepo.endpoint.merge({
                    owner,
                    repo,
                    page: lastPage - pageIndex,
                    per_page: perPage,
                });

                const { data } = await octokit.request(listArtifactsForRepoToRemove)
                data.artifacts.map((artifact) => {
                    console.log(`Id: ${artifact.id}`);
                    console.log(`Node id: ${artifact.node_id}`);
                    console.log(`Name: ${artifact.name}`);
                    console.log(`Size (in bytes): ${artifact.size_in_bytes}`);
                    console.log(`Create at: ${artifact.created_at}`);
                    console.log('------------------------');
                    const createdAt = Date.parse(artifact.created_at);
                    if(!isDryRun && createdAt < Date.now() - (days * 86400) && artifactDeletedCount <= maxArtifacts) {
                        const deleteArtifact = octokit.actions.deleteArtifact.endpoint.merge({
                            owner,
                            repo,
                            artifact_id: artifact.id,
                        })
                        const deleteArtifactsPromise = octokit.request(deleteArtifact).then(response => {
                        }).catch(function(error) {
                            console.log(error);
                            artifactDeletedCount -= 1;
                        });
                        artifactDeletedCount += 1;
                        deleteArtifactsPromises.push(deleteArtifactsPromise);
                    }
                });
                pageIndex++;
                if(lastArtifactCount > 0)
                {
                    artifactToDeleteCount -= lastArtifactCount;
                    lastArtifactCount = 0;
                }else{
                    artifactToDeleteCount -= perPage;
                }
                // console.log('============DEBUG3============');
                // console.log(`artifactToDeleteCount: ${artifactToDeleteCount}`);
                // console.log(`lastPage: ${lastPage}`);
                // console.log(`pageIndex: ${pageIndex}`);
                // console.log(`lastPage - pageIndex: ${lastPage - pageIndex}`);
                // console.log('============ENDDEBUG============');
            }

            await Promise.all(deleteArtifactsPromises)

            console.log('========================');
            console.log(`Total artifacts deleted: ${artifactDeletedCount}`);    
        }

        deleteArtifacts();
    });
} catch (error) {
  core.setFailed(error.message);
}
