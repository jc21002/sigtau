package com.sigtau.sigtau;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.junit.jupiter.api.Assertions.*;
import java.time.LocalDate;
import java.util.Map;

@SpringBootTest(properties = {
 "spring.datasource.url=${TEST_DB_URL:jdbc:h2:mem:sigtau;MODE=PostgreSQL;DB_CLOSE_DELAY=-1}",
 "spring.datasource.driver-class-name=${TEST_DB_DRIVER:org.h2.Driver}", "spring.datasource.username=${TEST_DB_USER:sa}",
 "spring.datasource.password=${TEST_DB_PASSWORD:}", "spring.jpa.hibernate.ddl-auto=create-drop",
 "app.admin.email=admin@test.local", "app.admin.password=TestAdmin123!"
})
@AutoConfigureMockMvc
class WorkflowIntegrationTest {
 @Autowired MockMvc mvc;
 @Autowired ObjectMapper json;
 JsonNode request(MockHttpServletRequestBuilder req, String token, Object body, int status) throws Exception {
  if(token != null) req.header("Authorization", "Bearer " + token);
  if(body != null) req.contentType("application/json").content(json.writeValueAsString(body));
  String result=mvc.perform(req).andExpect(status().is(status)).andReturn().getResponse().getContentAsString();
  return result.isBlank() ? json.createObjectNode() : json.readTree(result);
 }
 String login(String email,String password) throws Exception {
  return request(post("/auth/login"),null,Map.of("email",email,"password",password),200).get("token").asText();
 }
 long idByName(JsonNode list,String name) {
  for(JsonNode item:list) if(item.path("name").asText().equals(name)) return item.path("id").asLong();
  throw new AssertionError(name);
 }
 @Test void completeWorkflowAndAuthorization() throws Exception {
  String admin=login("admin@test.local","TestAdmin123!");
  request(post("/careers"),admin,Map.of("name","Ingeniería","description","Prueba"),200);
  long career=idByName(request(get("/careers"),admin,null,200),"Ingeniería");
  request(post("/subjects"),admin,Map.of("name","Cálculo","careerId",career),200);
  long subject=idByName(request(get("/subjects"),admin,null,200),"Cálculo");
  long modality=request(get("/modalities"),admin,null,200).get(0).get("id").asLong();
  request(put("/modalities/"+modality),admin,Map.of("name","Virtual","description","En línea"),200);
  request(post("/modalities"),admin,Map.of("name",""),400);
  request(post("/reasons"),admin,Map.of("name","Horario","description","Conflicto"),200);
  long reason=idByName(request(get("/reasons"),admin,null,200),"Horario");
  request(put("/reasons/"+reason),admin,Map.of("name","Horario actualizado"),200);
  long tutorRole=idByName(request(get("/roles"),admin,null,200),"TUTOR");
  long studentRole=idByName(request(get("/roles"),admin,null,200),"STUDENT");
  request(post("/users"),admin,Map.of("name","Tutor","email","tutor@test.local","phone","70000000","password","Tutor123!","roleId",tutorRole),200);
  long tutorId=idByName(request(get("/users"),admin,null,200),"Tutor");
  request(put("/users/"+tutorId),admin,Map.of("name","Tutor","email","tutor@test.local","phone","71111111","password","","roleId",tutorRole),200);
  String tutor=login("tutor@test.local","Tutor123!");
  request(post("/auth/register"),null,Map.of("name","Estudiante","email","student@test.local","phone","72222222","password","Student123!"),200);
  String student=login("student@test.local","Student123!");
  request(get("/users"),student,null,403);
  request(get("/tutorings"),null,null,401);
  request(post("/tutorings"),tutor,Map.of("title","Repaso","tutoringDate",LocalDate.now().plusDays(2).toString(),"startTime","10:00","endTime","11:00","capacity",1,"subjectId",subject,"modalityId",modality),200);
  long tid=request(get("/tutorings"),student,null,200).get(0).get("id").asLong();
  request(post("/enrollments"),student,Map.of("tutoringId",tid),200);
  request(post("/enrollments"),student,Map.of("tutoringId",tid),400);
  assertEquals(0,request(get("/tutorings/"+tid),student,null,200).get("availableSpots").asInt());
  long eid=request(get("/enrollments/my"),student,null,200).get(0).get("id").asLong();
  request(put("/enrollments/"+eid+"/cancel"),student,Map.of("reasonId",reason),200);
  request(put("/enrollments/"+eid+"/cancel"),student,Map.of(),400);
  assertEquals(1,request(get("/tutorings/"+tid),student,null,200).get("availableSpots").asInt());
  request(post("/enrollments"),student,Map.of("tutoringId",tid),200);
  request(put("/users/"+tutorId),admin,Map.of("name","Tutor","email","tutor@test.local","phone","71111111","roleId",studentRole),200);
  request(get("/tutorings/mine"),tutor,null,403);
 }
}
