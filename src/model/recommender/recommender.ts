interface IRecommender {
    recommend(n?: number): Set<string>;
    hit(id: string, action: string): void;
}

export {
    IRecommender
}