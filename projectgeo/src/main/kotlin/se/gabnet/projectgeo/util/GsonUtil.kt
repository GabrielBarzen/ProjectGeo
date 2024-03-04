package se.gabnet.projectgeo.util

import com.google.gson.Gson
import com.google.gson.GsonBuilder

object GsonUtil {
    var repositoryGson: Gson = GsonBuilder().excludeFieldsWithoutExposeAnnotation().create()
    var gson: Gson = GsonBuilder().create()

}