<?php

namespace AppBundle\Repository;

/**
 * SpeciesRepository
 *
 * This class was generated by the Doctrine ORM. Add your own custom
 * repository methods below.
 */
class SpeciesRepository extends \Doctrine\ORM\EntityRepository
{
	public function findScientificName()
	{
		$query = $this->_em->createQuery('SELECT s FROM AppBundle:Species s');
		$results = $query->getResult();

		$scientificNameArray = [];

		// ajout de l'index 0
		array_unshift($scientificNameArray, "");

		foreach ($results as $scientificName) {
			array_push($scientificNameArray, $scientificName->getScientificName());
		}

		/*
		 *	Suppression de l'index 0 -> pour que les array keys
		 * 	soit en accord avec les IDs de la table Species
		 */
		unset($scientificNameArray[0]);

		return $scientificNameArray;
	}

	public function findSpeciesById($id)
	{
		$query = $this->_em->createQuery('SELECT s FROM AppBundle:Species s WHERE s.id = :id');
		$query->setParameter('id', $id);

		return $query->getSingleResult();
	}

    public function findSpeciesByScientificName($name)
    {
        $query = $this->_em->createQuery('SELECT s FROM AppBundle:Species s WHERE s.scienttificName = :scientifiName');
        $query->setParameter('scientificName', $name);

        return $query->getSingleResult();
    }
}
