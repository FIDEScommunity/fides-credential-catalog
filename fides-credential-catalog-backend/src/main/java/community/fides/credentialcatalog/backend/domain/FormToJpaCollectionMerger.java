package community.fides.credentialcatalog.backend.domain;

import java.util.List;
import java.util.function.BiFunction;
import java.util.function.Function;

public class FormToJpaCollectionMerger<FormType, JpaType> {

    public List<JpaType> buildJpaCollection(List<FormType> formCollection, List<JpaType> jpaCollection,
                                            BiFunction<FormType, JpaType, Boolean> functionalKeyEqualsFunction,
                                            BiFunction<FormType, JpaType, JpaType> existingJpaEntryUpdater,
                                            Function<FormType, JpaType> newJpaEntryCreator) {
        final List<JpaType> newJapItems = formCollection.stream()
                .map(formElement -> findExistingOrAdd(jpaCollection, formElement, functionalKeyEqualsFunction, existingJpaEntryUpdater, newJpaEntryCreator))
                .toList();
        jpaCollection.clear();
        jpaCollection.addAll(newJapItems);
        return jpaCollection;
    }

    private JpaType findExistingOrAdd(final List<JpaType> jpaCollection, final FormType formElement,
                                      BiFunction<FormType, JpaType, Boolean> functionalKeyEqualsFunction,
                                      BiFunction<FormType, JpaType, JpaType> existingJpaEntryUpdater,
                                      Function<FormType, JpaType> newJpaEntryCreator
    ) {
        return jpaCollection.stream()
                .filter(jpaElement -> functionalKeyEqualsFunction.apply(formElement, jpaElement))
                .map(jpaElement -> existingJpaEntryUpdater.apply(formElement, jpaElement))
                .findFirst()
                .orElse(newJpaEntryCreator.apply(formElement));
    }

    public Boolean equals(final Object item1, final Object item2) {
        if ((item1 == null) || (item2 == null)){
            return false;
        }
        return item1.equals(item2);
    }


}
